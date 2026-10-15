import { test } from "node:test";
import assert from "node:assert/strict";
import { buildVCard, escapeVCardText } from "../../src/lib/vcard.ts";

test("wraps the card in BEGIN/END with CRLF line breaks", () => {
  const card = buildVCard({ name: "Dreamcoder" });
  assert.ok(card.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n"));
  assert.ok(card.endsWith("END:VCARD\r\n"));
  assert.equal(
    card.split("\n").filter(Boolean).length,
    card.split("\r\n").filter(Boolean).length,
  );
});

test("normalizes the phone to + and digits", () => {
  const card = buildVCard({ name: "D", phone: "+51 926 437 404" });
  assert.match(card, /\r\nTEL;TYPE=CELL:\+51926437404\r\n/);
});

test("escapes commas, semicolons, backslashes and newlines in text", () => {
  assert.equal(escapeVCardText("a,b;c\\d\ne"), "a\\,b\;c\\\\d\\ne");
  const card = buildVCard({ name: "D", note: "Software, IA; sistemas" });
  assert.match(card, /NOTE:Software\\, IA\; sistemas/);
});

test("omits optional fields that were not given", () => {
  const card = buildVCard({ name: "D" });
  assert.doesNotMatch(card, /TEL|EMAIL|URL|TITLE|NOTE/);
});
