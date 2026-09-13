/**
 * Shared colour math for the theme-state harness.
 *
 * `getComputedStyle` never returns a composited colour: an element's own colour
 * comes back *with its alpha* (`rgba(0, 0, 0, 0.16)`), and a `color-mix()` result
 * serialises as `color(srgb 0 0 0 / 0.89)`. Nothing in the platform tells us what
 * the pixels composed to, so the harness composites the chain itself — the same
 * sRGB byte-space source-over the design's figures were hand-computed with — and
 * only then applies the WCAG 2.x relative-luminance ratio.
 *
 * Both runners import this module: `tests/unit/tokens.test.ts` for the declared
 * literals and `tests/theme-state/*` for the computed styles. The filename carries
 * neither `.test.` nor `.spec.`, so neither runner's glob collects it as a test.
 */

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/;
const FUNCTIONAL = /^(rgba?|color)\((.+)\)$/;
const CHANNEL_MAX = 255;

function byte(value: string): number {
  return Number.parseInt(value.length === 1 ? value + value : value, 16);
}

function fromHex(hex: string): Rgba {
  const channels =
    hex.length <= 4
      ? [...hex].map((value) => byte(value))
      : (hex.match(/../g) ?? []).map((value) => byte(value));
  const alpha = channels.length === 4 ? channels[3] / CHANNEL_MAX : 1;
  return { r: channels[0], g: channels[1], b: channels[2], a: alpha };
}

/**
 * One channel of `rgb()`/`rgba()`/`color(srgb …)`. The two functions count
 * differently — `rgb()` in bytes (0-255), `color(srgb …)` in fractions (0-1) — so
 * the numeric scale is per function, while a percentage always means "of the byte"
 * in both.
 */
function parseChannel(value: string, numericScale: number): number {
  if (value.endsWith("%")) {
    return (Number.parseFloat(value) / 100) * CHANNEL_MAX;
  }
  return Number.parseFloat(value) * numericScale;
}

function parseAlpha(value: string): number {
  return value.endsWith("%")
    ? Number.parseFloat(value) / 100
    : Number.parseFloat(value);
}

export function parseColor(value: string): Rgba {
  const input = value.trim().toLowerCase();
  if (input === "transparent") return { r: 0, g: 0, b: 0, a: 0 };

  const hex = HEX.exec(input);
  if (hex) return fromHex(hex[1]);

  const functional = FUNCTIONAL.exec(input);
  if (!functional) {
    throw new Error(`contrast: unsupported colour value "${value}"`);
  }
  const name = functional[1];
  const body = functional[2];

  const slash = body.indexOf("/");
  const channelText = slash === -1 ? body : body.slice(0, slash);
  const alphaText = slash === -1 ? null : body.slice(slash + 1).trim();
  const parts = channelText.split(/[\s,]+/).filter((part) => part !== "");

  const values = name === "color" ? withoutColorSpace(parts) : parts;
  if (values.length < 3 || values.length > 4) {
    throw new Error(`contrast: "${value}" does not carry three channels`);
  }
  const inlineAlpha = values.length === 4 ? values[3] : null;
  const alpha = parseAlpha(alphaText ?? String(inlineAlpha ?? 1));
  const numericScale = name === "color" ? CHANNEL_MAX : 1;

  return {
    r: parseChannel(values[0], numericScale),
    g: parseChannel(values[1], numericScale),
    b: parseChannel(values[2], numericScale),
    a: alpha,
  };
}

function withoutColorSpace(parts: string[]): string[] {
  const [space, ...channels] = parts;
  if (space !== "srgb") {
    throw new Error(`contrast: unsupported colour space "${space}"`);
  }
  return channels;
}

/**
 * Source-over in sRGB byte space: `fg * a + bg * (1 - a)` for an opaque `bg`,
 * generalised to a translucent one. This is the formula every figure in the
 * design was computed with.
 */
export function composite(fg: Rgba | string, bg: Rgba | string): Rgba {
  const over = typeof fg === "string" ? parseColor(fg) : fg;
  const under = typeof bg === "string" ? parseColor(bg) : bg;
  const alpha = over.a + under.a * (1 - over.a);
  if (alpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const blend = (top: number, bottom: number) =>
    (top * over.a + bottom * under.a * (1 - over.a)) / alpha;
  return {
    r: blend(over.r, under.r),
    g: blend(over.g, under.g),
    b: blend(over.b, under.b),
    a: alpha,
  };
}

export function relativeLuminance(colour: Rgba | string): number {
  const { r, g, b } = typeof colour === "string" ? parseColor(colour) : colour;
  const linear = (channel: number) => {
    const value = channel / CHANNEL_MAX;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG 2.x contrast ratio: `(L1 + .05) / (L2 + .05)`, lighter first. */
export function ratio(a: Rgba | string, b: Rgba | string): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

export function formatRatio(value: number): string {
  return value.toFixed(2);
}

export function toCss(colour: Rgba): string {
  return `rgb(${Math.round(colour.r)}, ${Math.round(colour.g)}, ${Math.round(
    colour.b,
  )})`;
}

/**
 * Every `backgroundColor` from `el` up to the root, nearest layer first.
 *
 * The walk lives here but runs inside the page: `locator.evaluate()` serialises a
 * function's *source*, so this function must not reference module scope — it only
 * touches `getComputedStyle`. The compositing stays in `resolveBackground`/
 * `composite` above and runs in the test process, so there is exactly one
 * implementation of the colour math and both runners exercise it.
 */
export function backgroundChain(el: Element): string[] {
  const layers: string[] = [];
  let node: Element | null = el;
  while (node) {
    layers.push(getComputedStyle(node).backgroundColor);
    node = node.parentElement;
  }
  return layers;
}

/**
 * The effective opaque surface behind the element whose background chain this is.
 *
 * Layers arrive nearest-first, so each one is composited *over* the accumulator:
 * the element's own background over its parent's, over its grandparent's, and so
 * on. Iteration stops as soon as the accumulated stack is opaque — every layer
 * further out is then hidden behind it. The site always paints an opaque `html`
 * background, so the loop always terminates on one; a fully transparent chain falls
 * back to an opaque black canvas rather than returning a translucent "surface" that
 * no ratio could be computed against.
 */
export function resolveBackground(layers: readonly string[]): Rgba {
  let surface: Rgba = { r: 0, g: 0, b: 0, a: 0 };
  for (const layer of layers) {
    surface = composite(surface, layer);
    if (surface.a >= 1) return surface;
  }
  return composite(surface, { r: 0, g: 0, b: 0, a: 1 });
}
