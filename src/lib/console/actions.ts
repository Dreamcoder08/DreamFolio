/** Interprets a CommandActionDescriptor against the live DOM — the only
 *  place that touches navigation, the clipboard, or the theme toggle. */
import type { CommandDefinition } from "./types.ts";
import {
  ACTION_FAILED,
  THEME_UPDATED,
  copyFallback,
  emailCopied,
} from "./messages.ts";

export interface ActionContext {
  announce: (message: string) => void;
  showCopyFallback: (text: string) => void;
  hideCopyFallback: () => void;
  /** Closes the dialog. Actions call this themselves (rather than the
   *  caller closing up front) so a "copy" that fails can keep the dialog
   *  open long enough for showCopyFallback's input to actually be visible. */
  close: () => void;
}

async function copyToClipboard(
  text: string,
  ctx: ActionContext,
): Promise<void> {
  ctx.hideCopyFallback();
  try {
    if (!navigator.clipboard || !window.isSecureContext) {
      throw new Error("Clipboard API unavailable");
    }
    await navigator.clipboard.writeText(text);
    ctx.announce(emailCopied(text));
    ctx.close();
  } catch {
    // Stay open: showCopyFallback unhides and focuses an input that lives
    // inside this dialog — closing first would make it invisible.
    ctx.showCopyFallback(text);
    ctx.announce(copyFallback(text));
  }
}

async function perform(
  command: CommandDefinition,
  ctx: ActionContext,
): Promise<void> {
  const { action } = command;
  // Every close() runs after its side effect, not before: if the side
  // effect throws, the dialog (and its live region) stays open to report it.
  switch (action.kind) {
    case "navigate":
      window.location.href = action.href;
      ctx.close();
      break;
    case "external":
      window.open(action.href, "_blank", "noopener");
      ctx.close();
      break;
    case "theme": {
      const toggle = document.getElementById("theme-toggle");
      if (toggle instanceof HTMLElement) toggle.click();
      ctx.close();
      ctx.announce(THEME_UPDATED);
      break;
    }
    case "copy":
      await copyToClipboard(action.text, ctx);
      break;
  }
}

/** Never rejects: the driver fires this with `void`, so an escaped error
 *  would surface as an unhandled rejection with nothing announced. */
export async function runAction(
  command: CommandDefinition,
  ctx: ActionContext,
): Promise<void> {
  try {
    await perform(command, ctx);
  } catch (error) {
    console.error(error);
    ctx.announce(ACTION_FAILED);
  }
}
