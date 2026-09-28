/**
 * Capability probe for the convergence renderer: the context attributes the
 * WebGL2 canvas is requested with, and the software-renderer rejection that
 * catches what those attributes alone do not. Both paths lead to the same
 * "no field" fallback as having no WebGL2 at all.
 */

/**
 * Context attributes for the WebGL2 canvas, including
 * `failIfMajorPerformanceCaveat`: on browsers that honor it, a
 * software-only implementation (no real GPU) fails context creation
 * outright, the same as no WebGL2 at all. In practice this alone is not
 * sufficient — see `isSoftwareRenderer` below for why — but it is free
 * defense-in-depth on the browsers where it does work, and it documents
 * the intent. Exported so the e2e suite's own capability probe never
 * drifts from what `getContext` is actually called with here.
 */
export const WEBGL_CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  premultipliedAlpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  powerPreference: "low-power",
  failIfMajorPerformanceCaveat: true,
};

/**
 * Substrings that show up in `UNMASKED_RENDERER_WEBGL` for a software (no
 * real GPU) implementation, lowercased for a case-insensitive match.
 * SwiftShader is the one that actually matters here — measured: headless
 * Chromium's `getContext("webgl2", { failIfMajorPerformanceCaveat: true })`
 * still happily returns a context reporting
 * `ANGLE (Google, Vulkan ... (SwiftShader Device ...), SwiftShader driver)`
 * on the Chromium version this repo's Playwright/Lighthouse actually use —
 * the context attribute alone does not reject it. Rendering the field with
 * that renderer measured ~5.4s of Lighthouse Total Blocking Time on this
 * exact page (the same build with the field removed entirely scores TBT
 * 0ms), so this check exists to catch what the context attribute doesn't:
 * mount, read the renderer string back out, and bail if it's software —
 * same fallback path as "no WebGL2 at all". `llvmpipe` (Mesa's software
 * rasterizer, common on headless Linux without `libgl1-mesa-dri`/GPU
 * passthrough) and generic "software"/"microsoft basic render" strings are
 * included for the same reason on other platforms.
 */
const SOFTWARE_RENDERER_PATTERN =
  /swiftshader|llvmpipe|software|microsoft basic render/i;

/** Pure: whether an `UNMASKED_RENDERER_WEBGL` value names a software
 * implementation. Anything that is not a string never matches. */
export function isSoftwareRendererName(renderer: unknown): boolean {
  return (
    typeof renderer === "string" && SOFTWARE_RENDERER_PATTERN.test(renderer)
  );
}

export function isSoftwareRenderer(gl: WebGL2RenderingContext): boolean {
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  // Extension unavailable (blocked for fingerprinting, or just missing):
  // there is no reliable signal either way, so this check does not reject
  // the context — failIfMajorPerformanceCaveat above remains the (weaker)
  // line of defense in that case rather than over-rejecting real GPUs.
  if (!debugInfo) return false;
  const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  return isSoftwareRendererName(renderer);
}
