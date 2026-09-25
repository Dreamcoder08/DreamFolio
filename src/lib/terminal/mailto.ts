/** Builds a `mailto:` link for the MU-TH-UR transmission terminal.
 *
 * CSP sets `form-action 'none'`, so the composer can never actually submit
 * a form — this builds a plain `mailto:` URL that the driver assigns to
 * `location.href` instead. Pure and side-effect free: no throwing, no DOM. */

const MAX_MAILTO_LENGTH = 1800;
const TRUNCATION_MARKER = "\n\n[…transmisión truncada]";

export interface BuildMailtoInput {
  to: string;
  subject?: string;
  body: string;
}

/** Trims subject/body, URL-encodes them, and caps the total URL length so an
 *  overlong transmission can't produce a `mailto:` the OS or mail client
 *  refuses to open. Truncation always leaves room for the marker so the
 *  visitor can tell the message was cut, and never throws — a message that
 *  can't fit even alone just truncates further. */
export function buildMailto(input: BuildMailtoInput): string {
  const to = input.to.trim();
  const subject = (input.subject ?? "").trim();
  const body = input.body.trim();

  const base = `mailto:${encodeURIComponent(to)}`;
  const subjectParam = subject ? `subject=${encodeURIComponent(subject)}` : "";

  function withBody(text: string): string {
    const bodyParam = text ? `body=${encodeURIComponent(text)}` : "";
    const params = [subjectParam, bodyParam].filter(Boolean).join("&");
    return params ? `${base}?${params}` : base;
  }

  /** A slice index that never lands inside a UTF-16 surrogate pair (splitting
   *  one produces a lone surrogate, which encodeURIComponent rejects). */
  function safeSliceEnd(text: string, index: number): number {
    if (index <= 0 || index >= text.length) return index;
    const code = text.charCodeAt(index - 1);
    return code >= 0xd800 && code <= 0xdbff ? index - 1 : index;
  }

  let url = withBody(body);
  if (url.length <= MAX_MAILTO_LENGTH || !body) return url;

  // Binary-search the longest prefix of `body` (plus the truncation marker)
  // whose encoded URL still fits the cap, rather than guessing a character
  // count — encodeURIComponent can expand a single character (emoji, most
  // accents) into many percent-encoded bytes, so length in characters and
  // length in the final URL are not proportional.
  // Binary search over the raw integer index space (not the surrogate-safe
  // one) so low/high always strictly converge; safeSliceEnd only adjusts
  // where each candidate actually slices, which stays monotonic enough in
  // `mid` for the search to still land on (near) the longest fit.
  let low = 0;
  let high = body.length;
  let best = "";
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate =
      body.slice(0, safeSliceEnd(body, mid)) + TRUNCATION_MARKER;
    const candidateUrl = withBody(candidate);
    if (candidateUrl.length <= MAX_MAILTO_LENGTH) {
      best = candidate;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  url = withBody(best || TRUNCATION_MARKER.trim());
  return url;
}
