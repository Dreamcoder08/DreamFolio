import { test } from "node:test";
import assert from "node:assert/strict";
import {
  runAction,
  type ActionContext,
} from "../../src/lib/console/actions.ts";
import { THEME_UPDATED } from "../../src/lib/console/messages.ts";
import type { CommandDefinition } from "../../src/lib/console/types.ts";

class FakeHTMLElement {
  readonly onClick: () => void;
  constructor(onClick: () => void) {
    this.onClick = onClick;
  }
  click(): void {
    this.onClick();
  }
}

test("the theme action announces the change before it closes the dialog", async () => {
  const calls: string[] = [];
  const toggle = new FakeHTMLElement(() => calls.push("toggle"));
  (globalThis as { HTMLElement?: unknown }).HTMLElement = FakeHTMLElement;
  (globalThis as { document?: unknown }).document = {
    getElementById: (id: string) => (id === "theme-toggle" ? toggle : null),
  };
  const ctx: ActionContext = {
    announce: (message) => calls.push(`announce:${message}`),
    showCopyFallback: () => calls.push("showCopyFallback"),
    hideCopyFallback: () => calls.push("hideCopyFallback"),
    close: () => calls.push("close"),
  };
  const theme: CommandDefinition = {
    id: "theme",
    label: "Cambiar tema",
    group: "Sistema",
    keywords: [],
    action: { kind: "theme" },
  };

  await runAction(theme, ctx);

  // The live region lives inside the dialog: announcing after close() would
  // write into content a closed <dialog> has already dropped from the a11y tree.
  assert.deepEqual(calls, ["toggle", `announce:${THEME_UPDATED}`, "close"]);
});
