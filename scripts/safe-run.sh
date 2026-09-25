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
# Usage: scripts/safe-run.sh <command...>
#   SAFE_MEM (3G), SAFE_CPU (200% = 2 cores), SAFE_TEMP_PAUSE (80000),
#   SAFE_TEMP_RESUME (70000, millidegrees) override the defaults. Falls back to
#   plain `nice` where a user systemd manager is unavailable (CI, SSH).
set -euo pipefail

mem="${SAFE_MEM:-3G}"
cpu="${SAFE_CPU:-200%}"
pause_at="${SAFE_TEMP_PAUSE:-80000}"
resume_at="${SAFE_TEMP_RESUME:-70000}"
props=(-p MemoryMax="$mem" -p MemorySwapMax=0 -p CPUQuota="$cpu")

hottest() {
  # Read each zone on its own: `cat a b c | sort | tail` fails the whole
  # pipeline (pipefail) the moment one zone returns EIO/ENODATA, which used
  # to propagate through `temp="$(hottest)"` and kill the watchdog (set -e)
  # mid-run, leaving the scope frozen forever. A per-zone loop drops only
  # the unreadable zone and always returns 0, even with zero zones.
  local best="" zone
  for zone in /sys/class/thermal/thermal_zone*/temp; do
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

cleanup() {
  systemctl --user thaw "$unit" >/dev/null 2>&1 || true
  kill "$child" 2>/dev/null || true
}
# EXIT covers every way this script stops — a normal finish, `set -e`
# aborting on an unexpected failure, or a signal — so a frozen scope always
# gets thawed. HUP is listed too (a closed terminal), even though it would
# also reach EXIT, to make that path explicit; INT/TERM stay for a prompt
# thaw before their own EXIT fires.
trap cleanup EXIT HUP INT TERM

frozen=0
pauses=0
while kill -0 "$child" 2>/dev/null; do
  temp="$(hottest)"
  if [ -n "$temp" ]; then
    if [ "$frozen" = 0 ] && [ "$temp" -ge "$pause_at" ]; then
      systemctl --user freeze "$unit" >/dev/null 2>&1 && frozen=1 &&
        pauses=$((pauses + 1)) &&
        echo "safe-run: ${temp} m°C — paused until below ${resume_at}" >&2
    elif [ "$frozen" = 1 ] && [ "$temp" -le "$resume_at" ]; then
      systemctl --user thaw "$unit" >/dev/null 2>&1 && frozen=0 &&
        echo "safe-run: ${temp} m°C — resumed" >&2
    fi
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
