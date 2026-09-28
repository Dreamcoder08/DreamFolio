import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMailto } from "../../src/lib/terminal/mailto.ts";

const to = "dreamcoder.dev08@gmail.com";

test("builds a plain mailto with encoded subject and body", () => {
  const url = buildMailto({
    to,
    subject: "Hola & bienvenido",
    body: "Línea 1\nLínea 2",
  });
  assert.ok(url.startsWith(`mailto:${encodeURIComponent(to)}?`));
  assert.ok(url.includes(`subject=${encodeURIComponent("Hola & bienvenido")}`));
  assert.ok(url.includes(`body=${encodeURIComponent("Línea 1\nLínea 2")}`));
});

test("encodes &, ?, # and newlines so they cannot break the URL", () => {
  const url = buildMailto({ to, body: "a&b?c#d\ne" });
  const bodyParam = new URL(
    url.replace("mailto:", "https://x/"),
  ).searchParams.get("body");
  assert.equal(bodyParam, "a&b?c#d\ne");
});

test("encodes emoji and accented characters", () => {
  const url = buildMailto({ to, body: "Ñandú 🚀 café" });
  assert.ok(url.includes(encodeURIComponent("Ñandú 🚀 café")));
});

test("trims leading/trailing whitespace from subject and body", () => {
  const url = buildMailto({ to, subject: "  asunto  ", body: "  cuerpo  " });
  assert.ok(url.includes(`subject=${encodeURIComponent("asunto")}`));
  assert.ok(url.includes(`body=${encodeURIComponent("cuerpo")}`));
});

test("an empty body produces a mailto with no body param", () => {
  const url = buildMailto({ to, subject: "Solo asunto", body: "" });
  assert.equal(url, `mailto:${encodeURIComponent(to)}?subject=Solo%20asunto`);
});

test("an empty subject and body produces a bare mailto", () => {
  const url = buildMailto({ to, body: "" });
  assert.equal(url, `mailto:${encodeURIComponent(to)}`);
});

test("never throws on pathological input", () => {
  assert.doesNotThrow(() => buildMailto({ to, body: "x".repeat(10_000) }));
  assert.doesNotThrow(() => buildMailto({ to, body: "🚀".repeat(2000) }));
  assert.doesNotThrow(() => buildMailto({ to: "", body: "" }));
});

test("caps the total mailto URL length by truncating the body", () => {
  const url = buildMailto({ to, subject: "Asunto", body: "x".repeat(10_000) });
  assert.ok(url.length <= 1800);
});

test("a truncated body carries a visible marker", () => {
  const url = buildMailto({ to, body: "x".repeat(10_000) });
  const bodyParam = new URL(
    url.replace("mailto:", "https://x/"),
  ).searchParams.get("body");
  assert.ok(bodyParam?.includes("truncada"));
});

test("a body that already fits is never truncated", () => {
  const body = "Un mensaje corto y normal.";
  const url = buildMailto({ to, body });
  const bodyParam = new URL(
    url.replace("mailto:", "https://x/"),
  ).searchParams.get("body");
  assert.equal(bodyParam, body);
});

test("truncation caps the URL even with heavily-encoded (emoji) content", () => {
  const url = buildMailto({ to, subject: "Asunto", body: "🚀".repeat(1000) });
  assert.ok(url.length <= 1800);
});
