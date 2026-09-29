# Sourced by scripts/safe-run.sh: validation, the thermal read, the clock,
# the rise history and the freeze/thaw helpers.
# Kept apart so the watchdog loop in safe-run.sh stays readable and within
# the scripts/ line budget. Not executable on its own; the settings it reads
# (pause_at, thermal_glob, ...) are assigned, and the state it sets (frozen,
# freeze_min, ...) is read, by safe-run.sh.
# shellcheck shell=bash disable=SC2154,SC2034

# How far back rose_fast looks (ms): ~1 s, plus slack so a 1 s poll still
# sees its previous reading.
readonly RISE_WINDOW_MS=1250
# A rise this large (m°C) within RISE_WINDOW_MS pauses before PAUSE.
readonly RISE_DELTA=8000
# A freeze that cooled the zone this much (m°C) marks it load-related: no grace.
readonly FALL_DELTA=2000
# Exit status when the hard ceiling never clears (sysexits.h EX_TEMPFAIL).
readonly EX_TEMPFAIL=75

is_uint() { [[ "$1" =~ ^[0-9]+$ ]]; }

die_config() {
  echo "safe-run: $1" >&2
  exit 2
}

check_uint() {
  is_uint "$2" || die_config "$1 must be a non-negative integer (got '$2')"
}

# Rejects every setting that would quietly weaken or disable protection:
# exit 2 before anything runs, never run unguarded.
validate_config() {
  check_uint SAFE_TEMP_PAUSE "$pause_at"
  check_uint SAFE_TEMP_RESUME "$resume_at"
  check_uint SAFE_TEMP_HARD "$hard_at"
  check_uint SAFE_MAX_FREEZE "$max_freeze"
  check_uint SAFE_GRACE "$grace"
  check_uint SAFE_HARD_ABORT "$hard_abort"
  [ "$pause_at" -gt "$resume_at" ] ||
    die_config "SAFE_TEMP_PAUSE ($pause_at) must be greater than SAFE_TEMP_RESUME ($resume_at)"
  [ "$hard_at" -gt "$pause_at" ] ||
    die_config "SAFE_TEMP_HARD ($hard_at) must be greater than SAFE_TEMP_PAUSE ($pause_at)"
  [[ "$poll" =~ ^([0-9]+\.?[0-9]*|\.[0-9]+)$ && "$poll" =~ [1-9] ]] ||
    die_config "SAFE_POLL must be a positive number of seconds (got '$poll')"
  [ "$max_freeze" -ge 1 ] ||
    die_config "SAFE_MAX_FREEZE must be at least 1 second (got '$max_freeze')"
  [ "$hard_abort" -ge 1 ] ||
    die_config "SAFE_HARD_ABORT must be at least 1 second (got '$hard_abort')"
}

# Sets $temp to the hottest readable zone in millidegrees, or to "".
read_hottest() {
  # Read each zone on its own: `cat a b c | sort | tail` fails the whole
  # pipeline (pipefail) the moment one zone returns EIO/ENODATA, which used
  # to kill the watchdog (set -e) mid-run, leaving the scope frozen forever.
  # A per-zone loop drops only the unreadable (or non-numeric) zone. The
  # `read` builtin avoids a fork per zone at a 0.25 s poll.
  #
  # $thermal_glob is unquoted on purpose so the shell expands the glob; IFS
  # is narrowed to a newline so a pattern containing spaces is not also
  # word-split. An unmatched pattern stays literal and fails the -e test.
  local IFS=$'\n' zone value
  temp=""
  for zone in $thermal_glob; do
    [ -e "$zone" ] || continue
    value=""
    { read -r value || [ -n "$value" ]; } 2>/dev/null <"$zone" || continue
    is_uint "$value" || continue
    if [ -z "$temp" ] || [ "$value" -gt "$temp" ]; then temp=$value; fi
  done
}

# Wall-clock milliseconds for this tick: the freeze cap and the grace are
# measured on it, so they mean the same at any SAFE_POLL.
tick_clock() {
  local us=${EPOCHREALTIME//[.,]/}
  now_ms=$((us / 1000))
}

# The readings of the last RISE_WINDOW_MS, so rose_fast means "RISE_DELTA
# within about a second" at any SAFE_POLL.
hist_ms=() hist_temp=()
remember_reading() {
  [ -n "$temp" ] || return 0
  hist_ms+=("$now_ms") hist_temp+=("$temp")
  while [ $((now_ms - hist_ms[0])) -gt "$RISE_WINDOW_MS" ]; do
    hist_ms=("${hist_ms[@]:1}") hist_temp=("${hist_temp[@]:1}")
  done
}
rose_fast() {
  local old
  for old in "${hist_temp[@]}"; do
    [ $((temp - old)) -ge "$RISE_DELTA" ] && return 0
  done
  return 1
}

# Both always return 0 (set -e) and warn once per failure streak: the loop
# retries every poll, and a message per tick would bury the output.
freeze_scope() {
  if systemctl --user freeze "$unit" >/dev/null 2>&1; then
    frozen=1 frozen_since=$now_ms freeze_temp=$temp freeze_min=$temp hard_since=0
    pauses=$((pauses + 1)) freeze_fails=0
    echo "safe-run: ${temp} m°C${1:+ ($1)} — paused until below ${resume_at}" >&2
  else
    # Warn from the 2nd failure: the first tick can race scope registration.
    freeze_fails=$((freeze_fails + 1))
    if [ "$freeze_fails" = 2 ]; then echo "safe-run: systemctl --user freeze failed — retrying" >&2; fi
  fi
}
thaw_scope() {
  if systemctl --user thaw "$unit" >/dev/null 2>&1; then
    frozen=0 thaw_warned=0
    echo "safe-run: $1" >&2
  elif [ "$thaw_warned" = 0 ]; then
    echo "safe-run: systemctl --user thaw failed — still paused, retrying" >&2
    thaw_warned=1
  fi
}

# Fail closed, but never hang the caller: while frozen, a reading that stays
# at or above SAFE_TEMP_HARD for SAFE_HARD_ABORT seconds straight kills the
# scope without ever thawing it, and safe-run exits EX_TEMPFAIL.
check_hard_abort() {
  if [ "$temp" -lt "$hard_at" ]; then
    hard_since=0
    return 0
  fi
  [ "$hard_since" != 0 ] || hard_since=$now_ms
  [ $((now_ms - hard_since)) -ge $((hard_abort * 1000)) ] || return 0
  aborted=1
  disown "$child" 2>/dev/null || true # no "Killed" job notice from bash
  # SIGKILL reaches frozen tasks, so the scope dies without running again.
  systemctl --user kill --signal=KILL "$unit" >/dev/null 2>&1 || true
  systemctl --user stop "$unit" >/dev/null 2>&1 || true
  echo "safe-run: thermal guard: temperature stayed ≥ hard ceiling for ${hard_abort} s; command aborted" >&2
  exit "$EX_TEMPFAIL"
}
