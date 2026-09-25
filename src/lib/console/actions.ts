/** Interprets a CommandActionDescriptor against the live DOM — the only
 *  place that touches navigation, the clipboard, or the theme toggle. */
import type { CommandDefinition } from "./types.ts";

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
    ctx.announce(`Correo copiado al portapapeles: ${text}`);
    ctx.close();
  } catch {
    // Stay open: showCopyFallback unhides and focuses an input that lives
    // inside this dialog — closing first would make it invisible.
    ctx.showCopyFallback(text);
    ctx.announce(
      `No se pudo copiar automáticamente. Correo seleccionado: ${text}`,
    );
  }
}

export async function runAction(
  command: CommandDefinition,
  ctx: ActionContext,
): Promise<void> {
  const { action } = command;
  switch (action.kind) {
    case "navigate":
      ctx.close();
      window.location.href = action.href;
      break;
    case "external":
      ctx.close();
      window.open(action.href, "_blank", "noopener");
      break;
    case "theme": {
      ctx.close();
      const toggle = document.getElementById("theme-toggle");
      if (toggle instanceof HTMLElement) toggle.click();
      ctx.announce("Tema actualizado.");
      break;
    }
    case "copy":
      await copyToClipboard(action.text, ctx);
      break;
  }
}
