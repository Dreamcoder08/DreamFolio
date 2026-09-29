#!/usr/bin/env bash
# Run a heavy local command (build, e2e, perf probe, snapshots) inside a
# resource-capped systemd scope with a thermal watchdog.
#
# Why: headless Chromium rendering WebGL in software is CPU-hungry; on the
# dev laptop, parallel runs hit the kernel's critical temperature and forced
# hardware-protection shutdowns — even with a CPU quota. The watchdog freezes
# the scope's cgroup when the hottest thermal zone passes SAFE_TEMP_PAUSE and
# thaws it below SAFE_TEMP_RESUME, so the command slows down instead of the
# machine powering off. Measured on this laptop: CPU boost took the sensor
# from 67 °C to 95 °C in under a second (critical trip: 103 °C), so it polls
# every 0.25 s, runs on one core-equivalent by default, pauses at once at
# SAFE_TEMP_HARD (85 °C: a ~10-15 °C overshoot still stays below 103 °C),
# and pauses early when a reading above RESUME climbs 8 °C within ~1 s.
#
# Liveness: this laptop can idle above RESUME, and a stuck-hot or non-CPU
# zone never cools when the run is frozen, so hysteresis alone could pause a
# run forever. After SAFE_MAX_FREEZE the scope thaws anyway; if the reading
# did not fall by 2 °C while frozen (not load-related), a SAFE_GRACE window
# follows in which only SAFE_TEMP_HARD re-freezes, so the run always makes
# progress. At or above SAFE_TEMP_HARD there is no forced thaw and no grace.
#
# Usage: scripts/safe-run.sh <command...>
#   SAFE_MEM (3G), SAFE_CPU (100%; builds take longer, 200% restores two
#   cores), SAFE_THERMAL_GLOB (/sys/class/thermal/thermal_zone*/temp).
#   Millidegrees: SAFE_TEMP_PAUSE (80000), SAFE_TEMP_RESUME (70000),
#   SAFE_TEMP_HARD (85000). Seconds: SAFE_POLL (0.25), SAFE_MAX_FREEZE (180),
#   SAFE_GRACE (60), all wall-clock. Falls back to plain `nice` where a user
#   systemd manager is unavailable (CI, SSH).
set -euo pipefail
# shellcheck source-path=SCRIPTDIR source=lib/safe-run-lib.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/safe-run-lib.sh"

mem="${SAFE_MEM:-3G}"
cpu="${SAFE_CPU:-100%}"
pause_at="${SAFE_TEMP_PAUSE:-80000}"
resume_at="${SAFE_TEMP_RESUME:-70000}"
hard_at="${SAFE_TEMP_HARD:-85000}"
max_freeze="${SAFE_MAX_FREEZE:-180}"
grace="${SAFE_GRACE:-60}"
poll="${SAFE_POLL:-0.25}"
thermal_glob="${SAFE_THERMAL_GLOB:-/sys/class/thermal/thermal_zone*/temp}"
props=(-p MemoryMax="$mem" -p MemorySwapMax=0 -p CPUQuota="$cpu")
validate_config

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

# Fires on a normal finish, a `set -e` failure, or on_signal's `exit`.
# Always thaw; stop the unit only if it's somehow still around — the normal
# path below already waited for it, and on_signal already stopped it.
on_exit() {
  local status=$?
  systemctl --user thaw "$unit" >/dev/null 2>&1 || true
  systemctl --user is-active --quiet "$unit" 2>/dev/null &&
    systemctl --user stop "$unit" >/dev/null 2>&1
  exit "$status"
}
trap on_exit EXIT

frozen=0 frozen_since=0 freeze_temp=0 freeze_min=0 pauses=0
freeze_fails=0 thaw_warned=0 grace_until=0

while kill -0 "$child" 2>/dev/null; do
  read_hottest
  tick_clock
  if [ "$frozen" = 1 ] && [ -z "$temp" ]; then
    # Sensors vanished mid-freeze: we can no longer measure, so fail open
    # to "running" instead of freezing this cgroup forever.
    thaw_scope "thermal sensors unreadable while paused — resuming (fail open)"
  elif [ "$frozen" = 1 ]; then
    [ "$temp" -lt "$freeze_min" ] && freeze_min=$temp
    if [ "$temp" -le "$resume_at" ]; then
      thaw_scope "${temp} m°C — resumed"
    elif [ "$temp" -lt "$hard_at" ] && [ $((now_ms - frozen_since)) -ge $((max_freeze * 1000)) ]; then
      if [ $((freeze_temp - freeze_min)) -ge 2000 ]; then
        # Load-related zone: resume, and let PAUSE re-freeze it as usual.
        thaw_scope "paused over ${max_freeze}s at ${temp} m°C — resuming anyway"
      else
        thaw_scope "paused over ${max_freeze}s and ${temp} m°C never fell (stuck-hot zone?) — resuming, ${grace}s grace below ${hard_at}"
        [ "$frozen" = 0 ] && grace_until=$((now_ms + grace * 1000))
      fi
    fi
  elif [ -n "$temp" ]; then
    if [ "$temp" -ge "$hard_at" ]; then
      freeze_scope "hard ceiling"
    elif [ "$now_ms" -ge "$grace_until" ]; then
      if [ "$temp" -ge "$pause_at" ]; then
        freeze_scope ""
      elif [ "$temp" -ge "$resume_at" ] && rose_fast; then
        freeze_scope "rising fast"
      fi
    fi
  fi
  remember_reading
  sleep "$poll"
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
