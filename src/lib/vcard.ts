/** vCard 3.0 builder. Pure, so it is unit-testable under plain Node. */
export interface VCardInput {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  url?: string;
  note?: string;
}

/** RFC 6350 §3.4 text escaping: backslash, comma, semicolon, newline. */
export function escapeVCardText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\;");
}

export function buildVCard(input: VCardInput): string {
  const e = escapeVCardText;
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${e(input.name)}`,
    `N:;${e(input.name)};;;`,
  ];
  if (input.title) lines.push(`TITLE:${e(input.title)}`);
  if (input.email) lines.push(`EMAIL;TYPE=INTERNET:${input.email}`);
  if (input.phone)
    lines.push(`TEL;TYPE=CELL:${input.phone.replace(/[^\d+]/g, "")}`);
  if (input.url) lines.push(`URL:${input.url}`);
  if (input.note) lines.push(`NOTE:${e(input.note)}`);
  lines.push("END:VCARD");
  // vCard requires CRLF line breaks.
  return `${lines.join("\r\n")}\r\n`;
}
