/** DOM driver for the ⌘K ship console. Dynamically imported on first use
 *  (see CommandConsole.astro's eager script) so its cost — this module plus
 *  filter.ts/render.ts/actions.ts — is paid only once actually opened.
 *
 *  Owns dialog state (open/close, active index, keyboard) and wires
 *  filter.ts (ranking), render.ts (DOM), and actions.ts (running a
 *  command) together. */
import { filterCommands, type FilteredCommand } from "./filter.ts";
import { renderOptions } from "./render.ts";
import { runAction, type ActionContext } from "./actions.ts";
import type { CommandDefinition } from "./types.ts";

function readCommands(): CommandDefinition[] {
  const el = document.getElementById("console-data");
  if (!el?.textContent) return [];
  try {
    const parsed: unknown = JSON.parse(el.textContent);
    return Array.isArray(parsed) ? (parsed as CommandDefinition[]) : [];
  } catch {
    return [];
  }
}

/** Mounts the console once. Returns an `open()` function the eager script
 *  calls on the first ⌘K / Ctrl+K or trigger click, and again on every
 *  subsequent one — mounting only wires listeners, it doesn't show anything. */
export function mountConsole(): () => void {
  const dialog = document.getElementById(
    "ship-console",
  ) as HTMLDialogElement | null;
  const input = document.getElementById(
    "console-input",
  ) as HTMLInputElement | null;
  const listbox = document.getElementById("console-listbox");
  const empty = document.getElementById("console-empty");
  const status = document.getElementById("console-status");
  const trigger = document.getElementById("console-trigger");
  const copyFallback = document.getElementById("console-copy-fallback");
  const copyInput = document.getElementById(
    "console-copy-input",
  ) as HTMLInputElement | null;

  if (!dialog || !input || !listbox || !status) {
    return () => {};
  }

  const allCommands = readCommands();
  let visible: FilteredCommand[] = [];
  let activeIndex = -1;
  let returnFocusTo: HTMLElement | null = null;

  const optionId = (index: number): string => `console-option-${index}`;
  const announce = (message: string): void => {
    status.textContent = message;
  };
  const hideCopyFallback = (): void => {
    if (copyFallback) copyFallback.hidden = true;
  };
  const showCopyFallback = (text: string): void => {
    if (!copyFallback || !copyInput) return;
    copyInput.value = text;
    copyFallback.hidden = false;
    copyInput.focus();
    copyInput.select();
  };
  const actionContext: ActionContext = {
    announce,
    showCopyFallback,
    hideCopyFallback,
    close: () => close(),
  };

  function updateActiveDescendant(): void {
    input!.setAttribute(
      "aria-activedescendant",
      activeIndex >= 0 ? optionId(activeIndex) : "",
    );
  }

  function setActive(index: number): void {
    if (index === activeIndex) return;
    const prev = document.getElementById(optionId(activeIndex));
    if (prev) prev.setAttribute("aria-selected", "false");
    activeIndex = index;
    const next = document.getElementById(optionId(activeIndex));
    if (next) {
      next.setAttribute("aria-selected", "true");
      next.scrollIntoView({ block: "nearest" });
    }
    updateActiveDescendant();
  }

  function render(query: string): void {
    hideCopyFallback();
    visible = filterCommands(allCommands, query);
    activeIndex = visible.length ? 0 : -1;

    if (!visible.length) {
      if (empty) empty.hidden = false;
      listbox!.innerHTML = "";
      updateActiveDescendant();
      announce("Sin resultados.");
      return;
    }
    if (empty) empty.hidden = true;

    renderOptions(listbox!, visible, activeIndex, optionId, {
      onHover: setActive,
      onSelect: (index) => {
        setActive(index);
        execute();
      },
    });
    updateActiveDescendant();
    announce(`${visible.length} resultado${visible.length === 1 ? "" : "s"}.`);
  }

  function moveActive(delta: number): void {
    if (!visible.length) return;
    setActive((activeIndex + delta + visible.length) % visible.length);
  }

  function moveToEdge(edge: "start" | "end"): void {
    if (!visible.length) return;
    setActive(edge === "start" ? 0 : visible.length - 1);
  }

  function execute(): void {
    const entry = visible[activeIndex];
    if (!entry) return;
    // Actions close the dialog themselves (see actions.ts) — a failed copy needs it to stay open for its fallback input.
    void runAction(entry.command, actionContext);
  }

  function open(): void {
    if (dialog!.open) {
      // Re-focus without resetting: keeps the query, never touches returnFocusTo.
      input!.focus();
      return;
    }
    returnFocusTo =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : trigger instanceof HTMLElement
          ? trigger
          : null;
    input!.value = "";
    hideCopyFallback();
    dialog!.showModal();
    render("");
    input!.focus();
  }

  function close(): void {
    if (dialog!.open) dialog!.close();
  }

  input.addEventListener("input", () => render(input.value));
  input.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveActive(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveActive(-1);
        break;
      case "Home":
        event.preventDefault();
        moveToEdge("start");
        break;
      case "End":
        event.preventDefault();
        moveToEdge("end");
        break;
      case "Enter":
        event.preventDefault();
        execute();
        break;
      default:
        break;
    }
  });

  // <dialog> already closes on Esc and dispatches "close"; only focus
  // restore is left to do here.
  dialog.addEventListener("close", () => {
    if (returnFocusTo) returnFocusTo.focus();
  });

  // No built-in "click backdrop to dismiss" — target === dialog means the
  // click landed on the backdrop, since the panel is a child element.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close();
  });

  return open;
}
