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
