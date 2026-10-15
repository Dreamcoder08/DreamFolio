import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWhatsAppUrl } from "../../src/lib/whatsapp.ts";

test("builds a bare wa.me link from an E.164 number", () => {
  assert.equal(buildWhatsAppUrl("51926437404"), "https://wa.me/51926437404");
});

test("strips +, spaces and dashes so a display number also works", () => {
  assert.equal(
    buildWhatsAppUrl("+51 926-437-404"),
    "https://wa.me/51926437404",
  );
});

test("encodes the pre-filled message, accents and & included", () => {
  const url = new URL(buildWhatsAppUrl("51926437404", "Hola & qué tal?"));
  assert.equal(url.origin + url.pathname, "https://wa.me/51926437404");
  assert.equal(url.searchParams.get("text"), "Hola & qué tal?");
});

test("a blank message produces no text param", () => {
  assert.equal(
    buildWhatsAppUrl("51926437404", "   "),
    "https://wa.me/51926437404",
  );
});

test("rejects a number with no digits", () => {
  assert.throws(() => buildWhatsAppUrl("abc"));
});
