// Shared by the dev-only review scripts (visual-snapshots, perf-probe):
// lets headless Chromium run the hero convergence field for inspection.
//
// Production code intentionally treats a software-only WebGL2 implementation
// (SwiftShader, which is what headless Chromium uses by default) the same as
// "no WebGL2" — see renderer.ts's `isSoftwareRenderer` for why: rendering
// the field on SwiftShader was measured costing ~5.4s of Lighthouse Total
// Blocking Time. That's the right behavior for a real visitor's browser,
// but it means this dev-only review tool would otherwise always see the
// field removed and have nothing to screenshot. Two layers, matching the
// two checks production actually makes, both scoped to this script alone —
// never shipped into the production bundle (no `?convergence=force` query
// param or similar reachable by a real visitor):
//  1. `--enable-unsafe-swiftshader` tells Chromium the software rasterizer
//     is being used on purpose, which is what `failIfMajorPerformanceCaveat`
//     needs to not reject it up front (belt-and-suspenders: measured, this
//     Chromium build returns a context either way — see layer 2).
//  2. `isSoftwareRenderer` itself reads the renderer string back via
//     `WEBGL_debug_renderer_info` and rejects anything matching
//     "swiftshader"/"llvmpipe"/etc. A page-init script below spoofs that
//     string to a real-GPU-looking one, entirely within this Playwright
//     browser context, so production's own check — unmodified — passes it.
export const FORCE_WEBGL_ARGS = [
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
];

// WEBGL_debug_renderer_info's UNMASKED_RENDERER_WEBGL spec constant.
export const FORCE_WEBGL_INIT = `(() => {
  const proto = window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype;
  if (!proto) return;
  const original = proto.getParameter;
  proto.getParameter = function patchedGetParameter(pname) {
    if (pname === 0x9246) {
      return "ANGLE (dev-only spoof in scripts/lib/force-webgl.mjs, not a real GPU)";
    }
    return original.call(this, pname);
  };
})();`;
