# Sourced by scripts/safe-run.sh: threshold validation and the thermal read.
# Kept apart so the watchdog loop in safe-run.sh stays readable and within
# the scripts/ line budget. Not executable on its own; the settings it reads
# (pause_at, thermal_glob, ...) are assigned by safe-run.sh before use.
# shellcheck shell=bash disable=SC2154

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
  [ "$pause_at" -gt "$resume_at" ] ||
    die_config "SAFE_TEMP_PAUSE ($pause_at) must be greater than SAFE_TEMP_RESUME ($resume_at)"
  [ "$hard_at" -gt "$pause_at" ] ||
    die_config "SAFE_TEMP_HARD ($hard_at) must be greater than SAFE_TEMP_PAUSE ($pause_at)"
  [ "$max_freeze" -ge 1 ] ||
    die_config "SAFE_MAX_FREEZE must be at least 1 second (got '$max_freeze')"
}

# Prints the hottest readable zone in millidegrees, or nothing.
hottest() {
  # Read each zone on its own: `cat a b c | sort | tail` fails the whole
  # pipeline (pipefail) the moment one zone returns EIO/ENODATA, which used
  # to propagate through `temp="$(hottest)"` and kill the watchdog (set -e)
  # mid-run, leaving the scope frozen forever. A per-zone loop drops only
  # the unreadable (or non-numeric) zone and always returns 0.
  #
  # $thermal_glob is unquoted on purpose so the shell expands the glob; IFS
  # is narrowed to a newline so a pattern containing spaces is not also
  # word-split. An unmatched pattern stays literal and fails the -e test.
  local IFS=$'\n' best="" zone temp
  for zone in $thermal_glob; do
    [ -e "$zone" ] || continue
    temp="$(cat "$zone" 2>/dev/null)" || continue
    is_uint "$temp" || continue
    if [ -z "$best" ] || [ "$temp" -gt "$best" ]; then
      best="$temp"
    fi
  done
  printf '%s' "$best"
}
