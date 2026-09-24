#!/usr/bin/env bash
# Run a heavy local command (build, e2e, perf probe, snapshots, Lighthouse)
# inside a resource-capped systemd scope.
#
# Why: headless Chromium rendering WebGL in software is CPU- and memory-hungry;
# on a 7 GB laptop, parallel runs exhausted memory and heat and shut the
# machine down. The cap makes the kernel throttle or OOM-kill the command
# instead of the whole machine.
#
# Usage: scripts/safe-run.sh <command...>
#   SAFE_MEM (default 3G) and SAFE_CPU (default 400%, i.e. 4 cores) override
#   the limits. Falls back to plain `nice` where systemd-run is unavailable.
set -euo pipefail

mem="${SAFE_MEM:-3G}"
cpu="${SAFE_CPU:-400%}"

# The binary alone is not enough: containers, CI runners and SSH sessions can
# have systemd-run installed without a reachable user manager (or without
# delegated memory/CPU controllers), where the capped call would fail instead
# of running the command — so probe with the same properties.
if command -v systemd-run >/dev/null 2>&1 &&
  systemd-run --user --scope --quiet \
    -p MemoryMax="$mem" -p MemorySwapMax=0 -p CPUQuota="$cpu" \
    true >/dev/null 2>&1; then
  exec systemd-run --user --scope --quiet \
    -p MemoryMax="$mem" -p MemorySwapMax=0 -p CPUQuota="$cpu" \
    nice -n 10 "$@"
fi

exec nice -n 10 "$@"
