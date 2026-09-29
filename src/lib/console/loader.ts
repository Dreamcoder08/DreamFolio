/** First-use loader for the ⌘K console, used by CommandConsole.astro's eager
 *  script. Kept out of the component so its failure branches are unit
 *  testable: the driver import, the reload, and the status sink are all
 *  injected. */
import { clearReloadFlag, shouldReload } from "./chunk-recovery.ts";
import { LOAD_FAILED, MOUNT_FAILED } from "./messages.ts";

export type OpenConsole = () => void;

export interface DriverModule {
  mountConsole: () => OpenConsole;
}

export interface ConsoleLoaderDeps {
  importDriver: () => Promise<DriverModule>;
  /** Writes the page-level status (empty string clears it). */
  report: (message: string) => void;
  reload: () => void;
}

/** Returns `ensureLoaded()`: resolves to the console's open() once mounted,
 *  or null when loading or mounting failed (after reporting why). */
export function createConsoleLoader(
  deps: ConsoleLoaderDeps,
): () => Promise<OpenConsole | null> {
  let loading: Promise<OpenConsole | null> | null = null;
  let mountFailed = false;

  // A stale hashed chunk (common right after a redeploy) makes the import
  // reject. One silent reload usually fixes it; a second failure fails
  // visibly instead of looping. Only the import is retried: a mount throw
  // is a bug a reload can't fix.
  async function load(): Promise<OpenConsole | null> {
    let mod: DriverModule;
    try {
      mod = await deps.importDriver();
    } catch {
      if (shouldReload()) {
        deps.reload();
        return null;
      }
      deps.report(LOAD_FAILED);
      return null;
    }
    // The chunk arrived, so any stale-chunk episode is over: drop its
    // error text and re-arm the one-time reload for a future redeploy.
    clearReloadFlag();
    deps.report("");
    try {
      return mod.mountConsole();
    } catch (error) {
      console.error(error);
      mountFailed = true;
      deps.report(MOUNT_FAILED);
      return null;
    }
  }

  return async function ensureLoaded() {
    // A failed mount is final for this page: re-running it on every
    // trigger would only stack another partial set of listeners.
    if (mountFailed) {
      deps.report(MOUNT_FAILED);
      return null;
    }
    // Shared while in flight, so a double trigger mounts only once.
    loading ??= load();
    const open = await loading;
    if (!open) loading = null;
    return open;
  };
}
