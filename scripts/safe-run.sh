#!/usr/bin/env bash
# Run a heavy local command (build, e2e, perf probe, snapshots) inside a
# resource-capped systemd scope with a thermal watchdog.
#
# Why: headless Chromium rendering WebGL in software is CPU-hungry; on the
# dev laptop, parallel runs hit the kernel's critical temperature and forced
# hardware-protection shutdowns — even with a CPU quota. The watchdog freezes
# the scope's cgroup when the hottest thermal zone passes SAFE_TEMP_PAUSE and
# thaws it below SAFE_TEMP_RESUME, so the command slows down instead of the
# machine powering off. It polls every second: temperature climbs fast
# enough that a 2 s poll overshot an 85 °C threshold to 92 °C.
#
# Defaults: 80 °C (SAFE_TEMP_PAUSE) leaves headroom below that ~92 °C
# overshoot and below the kernel's own critical trip point. 70 °C
# (SAFE_TEMP_RESUME) keeps hysteresis above the ~74 °C this laptop idles at —
# idle alone can exceed 70 °C, so a stuck-hot or non-CPU zone must never
# freeze a run forever; SAFE_MAX_FREEZE (180 s) is the escape hatch for that.
#
# Usage: scripts/safe-run.sh <command...>
#   SAFE_MEM (3G), SAFE_CPU (200% = 2 cores), SAFE_TEMP_PAUSE (80000),
#   SAFE_TEMP_RESUME (70000, millidegrees), SAFE_MAX_FREEZE (180, seconds),
#   SAFE_THERMAL_GLOB (/sys/class/thermal/thermal_zone*/temp) override the
#   defaults. Falls back to plain `nice` where a user systemd manager is
#   unavailable (CI, SSH).
set -euo pipefail

mem="${SAFE_MEM:-3G}"
cpu="${SAFE_CPU:-200%}"
pause_at="${SAFE_TEMP_PAUSE:-80000}"
resume_at="${SAFE_TEMP_RESUME:-70000}"
max_freeze="${SAFE_MAX_FREEZE:-180}"
thermal_glob="${SAFE_THERMAL_GLOB:-/sys/class/thermal/thermal_zone*/temp}"
props=(-p MemoryMax="$mem" -p MemorySwapMax=0 -p CPUQuota="$cpu")

is_uint() { [[ "$1" =~ ^[0-9]+$ ]]; }
check_uint() {
  is_uint "$2" || {
    echo "safe-run: $1 must be a non-negative integer (got '$2')" >&2
    exit 2
  }
}
check_uint SAFE_TEMP_PAUSE "$pause_at"
check_uint SAFE_TEMP_RESUME "$resume_at"
check_uint SAFE_MAX_FREEZE "$max_freeze"
if [ "$pause_at" -le "$resume_at" ]; then
  echo "safe-run: SAFE_TEMP_PAUSE ($pause_at) must be greater than SAFE_TEMP_RESUME ($resume_at)" >&2
  exit 2
fi

hottest() {
  # Read each zone on its own: `cat a b c | sort | tail` fails the whole
  # pipeline (pipefail) the moment one zone returns EIO/ENODATA, which used
  # to propagate through `temp="$(hottest)"` and kill the watchdog (set -e)
  # mid-run, leaving the scope frozen forever. A per-zone loop drops only
  # the unreadable zone and always returns 0, even with zero zones.
  local best="" zone
  for zone in $thermal_glob; do
    [ -e "$zone" ] || continue
    local temp
    temp="$(cat "$zone" 2>/dev/null)" || continue
    [ -n "$temp" ] || continue
    if [ -z "$best" ] || [ "$temp" -gt "$best" ] 2>/dev/null; then
      best="$temp"
    fi
  done
  printf '%s' "$best"
}

# Probe with the same properties the real run uses: the binary alone is not
# enough where no user manager (or no delegated controllers) exists.
if ! command -v systemd-run >/dev/null 2>&1 ||
  ! systemd-run --user --scope --quiet "${props[@]}" true >/dev/null 2>&1; then
  exec nice -n 10 "$@"
fi

unit="safe-run-$$-$RANDOM.scope"
systemd-run --user --scope --quiet --unit="$unit" "${props[@]}" \
  nice -n 10 "$@" &
child=$!

# A signal must stop the whole scope, not just $child: $child is only the
# systemd-run wrapper, it runs as a background job of this non-interactive
# bash (which makes it ignore SIGINT on its own), and Chromium/Playwright
# workers live under the scope's cgroup, not under $child directly.
# `systemctl --user stop` tears every process in the scope down at once.
on_signal() {
  systemctl --user thaw "$unit" >/dev/null 2>&1 || true
  systemctl --user stop "$unit" >/dev/null 2>&1 || true
  exit "$((128 + $1))"
}
trap 'on_signal 1' HUP
trap 'on_signal 2' INT
trap 'on_signal 15' TERM

# Fires on a normal finish, a `set -e` failure, or the `exit` inside
# on_signal above (exit always runs the EXIT trap too). Always thaw; stop
# the unit only if it's somehow still around — the normal path below
# already waited for it, and on_signal already stopped it.
on_exit() {
  local status=$?
  systemctl --user thaw "$unit" >/dev/null 2>&1 || true
  systemctl --user is-active --quiet "$unit" 2>/dev/null &&
    systemctl --user stop "$unit" >/dev/null 2>&1
  exit "$status"
}
trap on_exit EXIT

frozen=0
frozen_since=0
pauses=0
freeze_warned=0
while kill -0 "$child" 2>/dev/null; do
  temp="$(hottest)"
  now=$(date +%s)
  if [ "$frozen" = 1 ] && [ -z "$temp" ]; then
    # Sensors vanished mid-freeze: we can no longer measure, so fail open
    # to "running" instead of freezing this cgroup forever.
    systemctl --user thaw "$unit" >/dev/null 2>&1 && frozen=0
    echo "safe-run: thermal sensors unreadable while paused — resuming (fail open)" >&2
  elif [ "$frozen" = 1 ] && [ $((now - frozen_since)) -ge "$max_freeze" ]; then
    systemctl --user thaw "$unit" >/dev/null 2>&1 && frozen=0
    echo "safe-run: paused over ${max_freeze}s — resuming anyway (stuck-hot zone?)" >&2
  elif [ -n "$temp" ] && [ "$frozen" = 0 ] && [ "$temp" -ge "$pause_at" ]; then
    if systemctl --user freeze "$unit" >/dev/null 2>&1; then
      frozen=1
      frozen_since=$now
      pauses=$((pauses + 1))
      freeze_warned=0
      echo "safe-run: ${temp} m°C — paused until below ${resume_at}" >&2
    elif [ "$freeze_warned" = 0 ]; then
      echo "safe-run: systemctl --user freeze failed — retrying every second" >&2
      freeze_warned=1
    fi
  elif [ -n "$temp" ] && [ "$frozen" = 1 ] && [ "$temp" -le "$resume_at" ]; then
    systemctl --user thaw "$unit" >/dev/null 2>&1 && frozen=0 &&
      echo "safe-run: ${temp} m°C — resumed" >&2
  fi
  sleep 1
done

status=0
wait "$child" || status=$?
# A pause freezes timers too: on thaw, wall-clock timeouts (Playwright's
# included) fire at once, so failures after a pause may be spurious.
if [ "$pauses" -gt 0 ]; then
  echo "safe-run: paused ${pauses}x for heat — rerun timing failures" \
    "(e.g. playwright test --last-failed) before trusting them" >&2
fi
exit "$status"
