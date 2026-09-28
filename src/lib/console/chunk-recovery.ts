/** Guards a one-time page reload after a lazy-chunk import failure (e.g. a
 *  stale hashed chunk after a redeploy). Session-scoped so a visitor is
 *  never caught in a reload loop: any failure to read or write the guard
 *  flag (storage unavailable, private mode, quota) is treated as "already
 *  tried," since that's the only way to keep the guarantee without it. */
const RELOAD_FLAG = "console-chunk-reload";

export function shouldReload(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG) === "1") return false;
    sessionStorage.setItem(RELOAD_FLAG, "1");
    return true;
  } catch {
    return false;
  }
}

/** Re-arms the one-time reload once a chunk has actually loaded, so a later
 *  redeploy in the same session gets its own silent retry. A storage failure
 *  here is harmless: shouldReload() already treats it as "already tried." */
export function clearReloadFlag(): void {
  try {
    sessionStorage.removeItem(RELOAD_FLAG);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
