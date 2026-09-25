/** Listbox rendering: turns FilteredCommand[] into DOM <li> elements.
 *  No state of its own — driver.ts owns activeIndex/visible and passes
 *  them in, and gets hover/click back through callbacks. */
import type { FilteredCommand } from "./filter.ts";

function escapeHtml(value: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (c) => map[c] as string);
}

/** Wraps each matched range in <mark>, HTML-escaping the rest. */
export function highlightLabel(entry: FilteredCommand): string {
  const label = entry.command.label;
  if (!entry.ranges.length) return escapeHtml(label);
  let result = "";
  let cursor = 0;
  for (const range of entry.ranges) {
    result += escapeHtml(label.slice(cursor, range.start));
    result += `<mark>${escapeHtml(label.slice(range.start, range.end))}</mark>`;
    cursor = range.end;
  }
  result += escapeHtml(label.slice(cursor));
  return result;
}

export interface ListboxCallbacks {
  onHover: (index: number) => void;
  onSelect: (index: number) => void;
}

/** Rebuilds the listbox's children from scratch — grouped headings plus one
 *  <li role="option"> per command, in filtered/ranked order. */
export function renderOptions(
  listbox: HTMLElement,
  visible: FilteredCommand[],
  activeIndex: number,
  optionId: (index: number) => string,
  callbacks: ListboxCallbacks,
): void {
  listbox.innerHTML = "";
  let lastGroup = "";
  visible.forEach((entry, index) => {
    if (entry.command.group !== lastGroup) {
      lastGroup = entry.command.group;
      const heading = document.createElement("li");
      heading.className = "ship-console-group";
      heading.setAttribute("role", "presentation");
      heading.textContent = lastGroup;
      listbox.appendChild(heading);
    }
    const option = document.createElement("li");
    option.id = optionId(index);
    option.setAttribute("role", "option");
    option.className = "ship-console-option";
    option.setAttribute("aria-selected", String(index === activeIndex));
    option.innerHTML = highlightLabel(entry);
    option.addEventListener("mouseenter", () => callbacks.onHover(index));
    option.addEventListener("mousedown", (event) => event.preventDefault());
    option.addEventListener("click", () => callbacks.onSelect(index));
    listbox.appendChild(option);
  });
}
