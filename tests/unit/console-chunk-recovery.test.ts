import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clearReloadFlag,
  shouldReload,
} from "../../src/lib/console/chunk-recovery.ts";

interface MinimalStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

function setSessionStorage(storage: MinimalStorage | undefined): void {
  (globalThis as { sessionStorage?: MinimalStorage }).sessionStorage = storage;
}

test("returns true the first time in a session, then false", () => {
  const store = new Map<string, string>();
  setSessionStorage({
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
  });
  assert.equal(shouldReload(), true);
  assert.equal(shouldReload(), false);
});

test("treats a storage read failure as already tried", () => {
  setSessionStorage({
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {},
  });
  assert.equal(shouldReload(), false);
});

test("treats a storage write failure as already tried", () => {
  setSessionStorage({
    getItem: () => null,
    setItem: () => {
      throw new Error("quota exceeded");
    },
  });
  assert.equal(shouldReload(), false);
});

test("treats missing sessionStorage as already tried", () => {
  setSessionStorage(undefined);
  assert.equal(shouldReload(), false);
});

test("clearing the flag after a successful load re-arms one reload", () => {
  const store = new Map<string, string>();
  setSessionStorage({
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
  });
  assert.equal(shouldReload(), true);
  clearReloadFlag();
  assert.equal(shouldReload(), true);
  assert.equal(shouldReload(), false);
});

test("clearing the flag never throws when storage is unavailable", () => {
  setSessionStorage(undefined);
  assert.doesNotThrow(() => clearReloadFlag());
});
