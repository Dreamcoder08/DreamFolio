import { test } from "node:test";
import assert from "node:assert/strict";
import { filterCommands } from "../../src/lib/console/filter.ts";
import type { CommandDefinition } from "../../src/lib/console/types.ts";

function command(
  id: string,
  label: string,
  group = "Secciones",
  keywords: string[] = [],
): CommandDefinition {
  return {
    id,
    label,
    group,
    keywords,
    action: { kind: "navigate", href: `/#${id}` },
  };
}

test("empty query returns every command in its original grouped order", () => {
  const commands = [
    command("a", "Proyectos"),
    command("b", "Sobre mí"),
    command("c", "Enfoque"),
  ];

  assert.deepEqual(
    filterCommands(commands, "").map((r) => r.command.id),
    ["a", "b", "c"],
  );
  assert.deepEqual(
    filterCommands(commands, "   ").map((r) => r.command.id),
    ["a", "b", "c"],
  );
});

test("a query matching nothing returns no results", () => {
  const commands = [command("a", "Proyectos"), command("b", "Sobre mí")];
  assert.deepEqual(filterCommands(commands, "xyzxyz"), []);
});

test("accent-insensitive: 'dise' matches 'Diseño'", () => {
  const commands = [command("a", "Diseño"), command("b", "Otro comando")];
  const results = filterCommands(commands, "dise");
  assert.deepEqual(
    results.map((r) => r.command.id),
    ["a"],
  );
});

test("case-insensitive matching", () => {
  const commands = [command("a", "GitHub")];
  const results = filterCommands(commands, "GITHUB");
  assert.equal(results.length, 1);
});

test("prefix matches rank above word-start matches, which rank above plain substrings", () => {
  const commands = [
    command("substring", "Reproducir"), // "pro" mid-word (preceded by "re"), not a word start
    command("wordstart", "Ver Proyectos"), // "pro" at a word start, not at index 0
    command("prefix", "Proyectos"), // "pro" at index 0 == prefix
  ];
  const results = filterCommands(commands, "pro");
  assert.deepEqual(
    results.map((r) => r.command.id),
    ["prefix", "wordstart", "substring"],
  );
});

test("exact match ranks highest and returns the full label as the range", () => {
  const commands = [command("a", "Proyectos"), command("b", "Proyectos extra")];
  const results = filterCommands(commands, "Proyectos");
  assert.equal(results[0]?.command.id, "a");
  assert.deepEqual(results[0]?.ranges, [{ start: 0, end: 9 }]);
});

test("ties keep the original registry order (stable sort)", () => {
  const commands = [
    command("first", "Alpha proyecto"),
    command("second", "Beta proyecto"),
  ];
  const results = filterCommands(commands, "proyecto");
  assert.deepEqual(
    results.map((r) => r.command.id),
    ["first", "second"],
  );
});

test("a keyword-only match still surfaces the command, with no highlight range", () => {
  const commands = [
    command("a", "Ver todos los proyectos", "Proyectos", ["index", "lista"]),
  ];
  const results = filterCommands(commands, "lista");
  assert.equal(results.length, 1);
  assert.deepEqual(results[0]?.ranges, []);
});

test("label matches always outrank keyword-only matches", () => {
  const commands = [
    command("keyword-only", "Sistema", "Sistema", ["tema"]),
    command("label-match", "Tema oscuro", "Sistema", []),
  ];
  const results = filterCommands(commands, "tema");
  assert.deepEqual(
    results.map((r) => r.command.id),
    ["label-match", "keyword-only"],
  );
});
