import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCommands } from "../../src/lib/console/registry.ts";

const baseInput = {
  sections: [
    {
      id: "projects",
      label: "Proyectos",
      href: "/#projects",
      keywords: ["proyectos"],
    },
    {
      id: "connect",
      label: "Contacto",
      href: "/#connect",
      keywords: ["contacto"],
    },
  ],
  allProjectsHref: "/projects/",
  projects: [{ slug: "drenyra", title: "Drenyra", href: "/projects/drenyra/" }],
  githubHref: "https://github.com/Dreamcoder08",
  xHref: "https://x.com/Dreamcoder08",
  mailtoHref: "mailto:dreamcoder.dev08@gmail.com",
  email: "dreamcoder.dev08@gmail.com",
};

test("builds one navigate command per section, in order", () => {
  const commands = buildCommands(baseInput);
  const sectionCommands = commands.filter((c) => c.group === "Secciones");
  assert.deepEqual(
    sectionCommands.map((c) => c.action),
    [
      { kind: "navigate", href: "/#projects" },
      { kind: "navigate", href: "/#connect" },
    ],
  );
});

test("includes the all-projects index and one command per project", () => {
  const commands = buildCommands(baseInput);
  const projectGroup = commands.filter((c) => c.group === "Proyectos");
  assert.equal(projectGroup.length, 2);
  assert.equal(projectGroup[0]?.id, "all-projects");
  assert.deepEqual(projectGroup[1]?.action, {
    kind: "navigate",
    href: "/projects/drenyra/",
  });
});

test("includes theme, copy-email, github, x and mailto commands", () => {
  const commands = buildCommands(baseInput);
  const byId = Object.fromEntries(commands.map((c) => [c.id, c]));

  assert.deepEqual(byId["toggle-theme"]?.action, { kind: "theme" });
  assert.deepEqual(byId["copy-email"]?.action, {
    kind: "copy",
    text: "dreamcoder.dev08@gmail.com",
  });
  assert.deepEqual(byId["open-github"]?.action, {
    kind: "external",
    href: "https://github.com/Dreamcoder08",
  });
  assert.deepEqual(byId["open-x"]?.action, {
    kind: "external",
    href: "https://x.com/Dreamcoder08",
  });
  assert.deepEqual(byId["write-email"]?.action, {
    kind: "external",
    href: "mailto:dreamcoder.dev08@gmail.com",
  });
});

test("every command id is unique", () => {
  const commands = buildCommands(baseInput);
  const ids = commands.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("an empty project list still produces the static commands", () => {
  const commands = buildCommands({ ...baseInput, projects: [] });
  assert.ok(commands.some((c) => c.id === "all-projects"));
  assert.equal(commands.filter((c) => c.id.startsWith("project-")).length, 0);
});

test("groups appear with the frequent actions first", () => {
  const groups = [...new Set(buildCommands(baseInput).map((c) => c.group))];
  assert.deepEqual(groups, ["Acciones", "Secciones", "Proyectos", "Enlaces"]);
});
