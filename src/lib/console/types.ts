/** Shared types for the ⌘K ship console. Kept dependency-free so the
 *  registry and filter stay pure and unit-testable without a DOM. */

/** What running a command actually does. The DOM driver interprets these;
 *  this module only describes them as data. */
export type CommandActionDescriptor =
  | { kind: "navigate"; href: string }
  | { kind: "theme" }
  | { kind: "copy"; text: string }
  | { kind: "external"; href: string };

export interface CommandDefinition {
  id: string;
  label: string;
  group: string;
  /** Extra search terms besides the label (aliases, Spanish/English, slugs). */
  keywords: string[];
  action: CommandActionDescriptor;
}
