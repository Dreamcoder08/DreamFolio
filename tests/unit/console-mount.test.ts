import { test } from "node:test";
import assert from "node:assert/strict";
import { mountConsole } from "../../src/lib/console/driver.ts";
import {
  createConsoleLoader,
  type DriverModule,
} from "../../src/lib/console/loader.ts";
import { LOAD_FAILED, MOUNT_FAILED } from "../../src/lib/console/messages.ts";
import { installConsoleDom } from "./support/fake-console-dom.ts";

function setSessionStorage(store: Map<string, string> | undefined): void {
  (globalThis as { sessionStorage?: unknown }).sessionStorage = store && {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
  };
}

/** A loader over the real driver, counting mounts and recording reports. */
function loaderOverRealDriver() {
  const reports: string[] = [];
  let mounts = 0;
  const driver: DriverModule = {
    mountConsole: () => {
      mounts += 1;
      return mountConsole();
    },
  };
  const ensureLoaded = createConsoleLoader({
    importDriver: async () => driver,
    report: (message) => reports.push(message),
    reload: () => assert.fail("a mount failure must never reload"),
  });
  return { ensureLoaded, reports, mounts: () => mounts };
}

test("a successful mount wires each listener exactly once", async () => {
  const dom = installConsoleDom();
  setSessionStorage(new Map());
  const { ensureLoaded, mounts } = loaderOverRealDriver();

  const [first, second] = await Promise.all([ensureLoaded(), ensureLoaded()]);
  const third = await ensureLoaded();

  assert.equal(typeof first, "function");
  assert.equal(second, first);
  assert.equal(third, first);
  assert.equal(mounts(), 1);
  assert.equal(dom["console-input"].listenerCount(), 2);
  assert.equal(dom["ship-console"].listenerCount(), 2);
});

test("a mount that throws part-way detaches what it already attached", (t) => {
  t.mock.method(console, "error", () => {});
  const dom = installConsoleDom();
  dom["ship-console"].failOn = "click";

  assert.throws(() => mountConsole(), /cannot listen to click/);
  assert.equal(dom["console-input"].listenerCount(), 0);
  assert.equal(dom["ship-console"].listenerCount(), 0);
});

test("a failed mount shows its status and is never re-run by a later trigger", async (t) => {
  t.mock.method(console, "error", () => {});
  const dom = installConsoleDom();
  dom["ship-console"].failOn = "click";
  setSessionStorage(new Map());
  const { ensureLoaded, reports, mounts } = loaderOverRealDriver();

  assert.equal(await ensureLoaded(), null);
  assert.deepEqual(reports, ["", MOUNT_FAILED]);

  assert.equal(await ensureLoaded(), null);
  assert.equal(await ensureLoaded(), null);
  assert.equal(mounts(), 1);
  assert.equal(reports.at(-1), MOUNT_FAILED);
  assert.equal(dom["console-input"].listenerCount(), 0);
  assert.equal(dom["ship-console"].listenerCount(), 0);
});

test("a rejected import reloads once, then reports and retries the import", async () => {
  setSessionStorage(new Map());
  const reports: string[] = [];
  let imports = 0;
  let reloads = 0;
  const ensureLoaded = createConsoleLoader({
    importDriver: async () => {
      imports += 1;
      throw new Error("stale chunk");
    },
    report: (message) => reports.push(message),
    reload: () => void (reloads += 1),
  });

  assert.equal(await ensureLoaded(), null);
  assert.equal(reloads, 1);
  assert.deepEqual(reports, []);

  assert.equal(await ensureLoaded(), null);
  assert.equal(reloads, 1);
  assert.deepEqual(reports, [LOAD_FAILED]);
  assert.equal(imports, 2);
});
