/**
 * DOM/rAF driver for the hero convergence field. This is the only module
 * that touches `window`/`document` directly: it wires the pure field +
 * progress modules and the WebGL renderer to real browser events
 * (mount, resize, scroll, visibility, pointer, theme).
 *
 * `mountConvergenceField` never throws — every failure path (no WebGL2, a
 * compile error, a missing hero element) falls back to removing the canvas
 * so the hero renders exactly as it does with JavaScript disabled.
 */

import {
  createField,
  type Rect,
  type Field,
  type FieldLayoutMode,
} from "./field.ts";
import { combineProgress, introProgress, scrollProgress } from "./progress.ts";
import {
  computeAspectScale,
  createRenderer,
  MAX_PROTECT_RECTS,
  type ConvergenceRenderer,
} from "./renderer.ts";
import {
  domRectToFieldAnchor,
  pickParticleCount,
  readThemeColors,
} from "./theme-geometry.ts";

export interface ConvergenceHandle {
  dispose(): void;
}

/** Fixed so the hero graph is stable across reloads — a design choice, not
 * a secret, so it is fine to read directly out of the source. */
const FIELD_SEED = 0x5f3759df;

const NARROW_BREAKPOINT = 720;
const DPR_CAP = 1.75;
const POINTER_SMOOTHING = 0.12;
const POINTER_IDLE_TIMEOUT_MS = 220;
/** Below this, a progress/pointer delta is visually imperceptible — the
 * render-on-demand loop below treats the field as "settled" once every
 * exponential-smoothing target has converged past these, rather than
 * requiring an exact match it would asymptotically never reach. */
const PROGRESS_EPSILON = 0.0005;
const POINTER_EPSILON = 0.001;
/** Mount is deferred off the critical path (see ConvergenceField.astro):
 * `requestIdleCallback` with this timeout, falling back to a short
 * `setTimeout` where the callback doesn't exist (Safari). Exported so the
 * component's own deferral script and this module agree on one number. */
export const MOUNT_IDLE_TIMEOUT_MS = 1500;
// Raised from the first pass so the field reads clearly on dark instead of
// like dust. Text contrast is now protected by keeping hubs out of every
// small-text/interactive hero rect (field.ts's exclusions) and dimming
// particles and edge lines near them (see uProtect/uProtectCount in
// shaders.ts) rather than a column-wide mask that hid the whole headline.
const WIDE_ALPHA = 0.8;
const NARROW_ALPHA = 0.5;

// `parseHexColor`, `readThemeColors`, `pickParticleCount` and
// `domRectToFieldAnchor` used to live here. They are pure functions of
// plain inputs (a color string, a rect, a particle-count decision) that
// only touched the DOM by convenience, so T0 of the sci-fi scroll narrative
// phase moved them to `theme-geometry.ts` for standalone unit tests and
// imports them above. What stays below — `measureRect`, `buildField`,
// `computeExclusions`, `updateProtectUniform`, `applyResize`, the render
// loop, every listener — is deliberately still one large closure rather
// than a further-split module: each of those functions reads or mutates
// mount-local state (`canvas`, `heroEl`, `layout`, `aspectScale`,
// `protectRectsUniform`, `renderer`, `disposed`, …) that only exists once
// `mountUnsafe` has started running, and splitting them out would mean
// threading that whole bag of mutable fields through an explicit context
// object on every call instead of a closure capturing it for free. That
// is a real refactor with its own risk/benefit tradeoff, not a mechanical
// extraction, so it stays out of scope here.

/**
 * Returns a `Promise` (T4f): `renderer.ts`'s `createRenderer` now runs the
 * field build + shader compile/link + buffer upload as several yielded
 * steps rather than one synchronous call — see its own comment for why.
 * `ConvergenceField.astro`'s caller already discards the return value
 * (cleanup is self-managed via the `astro:before-swap`/`pagehide`
 * listeners this function and `mountUnsafe` attach), so this is not a
 * breaking change for that call site.
 */
export async function mountConvergenceField(
  canvas: HTMLCanvasElement,
  heroEl: HTMLElement,
): Promise<ConvergenceHandle | null> {
  try {
    return await mountUnsafe(canvas, heroEl);
  } catch {
    try {
      canvas.remove();
    } catch {
      /* nothing left to clean up */
    }
    return null;
  }
}

async function mountUnsafe(
  canvas: HTMLCanvasElement,
  heroEl: HTMLElement,
): Promise<ConvergenceHandle | null> {
  const reducedMotionQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
  const pointerFineQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(pointer: fine)")
      : null;

  let isNarrow = window.innerWidth <= NARROW_BREAKPOINT;
  let layout: FieldLayoutMode = isNarrow ? "narrow" : "wide";

  // The portrait card and every small-text/interactive hero block are
  // measured directly from the DOM rather than assumed as fixed fractions
  // of the canvas: the hero grid's ratio changes across breakpoints (see
  // portfolio.css), and the canvas itself is full-bleed while this content
  // stays wrap-width. The portrait is only excluded on wide layouts — on
  // narrow it stacks below the copy and can span nearly the full width, so
  // excluding it there risks leaving the hub sampler too little room. Every
  // text block stays excluded on both: keeping hubs off small/interactive
  // text matters regardless of layout, and rejection sampling degrades
  // gracefully (fewer hubs) rather than failing outright if room gets
  // tight. The headline is large display type — protected as a hub
  // exclusion only (see PROTECT_ELEMENTS below for why it does not also
  // get alpha dimming).
  const portraitEl = heroEl.querySelector<HTMLElement>(".hero-portrait");
  const headlineEl = heroEl.querySelector<HTMLElement>(".hero-copy h1");
  const kickerEl = heroEl.querySelector<HTMLElement>(".hero-kicker");
  const introEl = heroEl.querySelector<HTMLElement>(".hero-intro");
  const briefEl = heroEl.querySelector<HTMLElement>(".hero-brief");
  const tickerEl = heroEl.querySelector<HTMLElement>(".hero-ticker");

  // Every small-text/interactive block that also gets the shader's alpha
  // dimming (not just a hub exclusion) — the headline is deliberately left
  // out: it is large display type that only needs 3:1 contrast, so faint
  // particles/edges behind it are fine (see WIDE_ALPHA's comment). Capped
  // at MAX_PROTECT_RECTS, which the shader's uProtect array is sized to;
  // the hero has 4 today, comfortably under the 6-slot budget.
  const PROTECT_ELEMENTS = [kickerEl, introEl, briefEl, tickerEl];

  const initialCanvasBox = canvas.getBoundingClientRect();
  let aspectScale = computeAspectScale(
    initialCanvasBox.width || heroEl.clientWidth || 1,
    initialCanvasBox.height || heroEl.clientHeight || 1,
  );

  function measureRect(el: HTMLElement | null): Rect | undefined {
    if (!el) return undefined;
    const canvasBox = canvas.getBoundingClientRect();
    if (canvasBox.width <= 0 || canvasBox.height <= 0) return undefined;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return undefined;
    return domRectToFieldAnchor(rect, canvasBox, aspectScale);
  }

  function computeExclusions(): Rect[] {
    const candidates = isNarrow
      ? [headlineEl, ...PROTECT_ELEMENTS]
      : [portraitEl, headlineEl, ...PROTECT_ELEMENTS];
    const rects: Rect[] = [];
    for (const el of candidates) {
      const rect = measureRect(el);
      if (rect) rects.push(rect);
    }
    return rects;
  }

  function buildField(): Field {
    const box = canvas.getBoundingClientRect();
    const aspect =
      (box.width || heroEl.clientWidth || 1) /
      Math.max(1, box.height || heroEl.clientHeight || 1);
    return createField({
      count: pickParticleCount(
        isNarrow,
        typeof navigator !== "undefined"
          ? navigator.hardwareConcurrency
          : undefined,
      ),
      seed: FIELD_SEED,
      aspect,
      layout,
      exclusions: computeExclusions(),
    });
  }

  // Cached (not per-frame) protect-rect uniform state for the vertex/
  // fragment shaders' targeted alpha dimming — see uProtect/uProtectCount
  // in shaders.ts. A single reused Float32Array (never reallocated) sized
  // to MAX_PROTECT_RECTS * 4 floats; only the first `protectCount` rects
  // are meaningful, matching the shader's own early-break loop. Recomputed
  // only on mount/resize/rebuild, alongside the exclusions above, so the
  // render loop itself stays allocation-free.
  const protectRectsUniform = new Float32Array(MAX_PROTECT_RECTS * 4);
  let protectCountUniform = 0;

  function updateProtectUniform() {
    let count = 0;
    for (const el of PROTECT_ELEMENTS) {
      if (count >= MAX_PROTECT_RECTS) break;
      const rect = measureRect(el);
      if (!rect) continue;
      protectRectsUniform[count * 4] = rect.x;
      protectRectsUniform[count * 4 + 1] = rect.y;
      protectRectsUniform[count * 4 + 2] = rect.w / 2;
      protectRectsUniform[count * 4 + 3] = rect.h / 2;
      count += 1;
    }
    protectCountUniform = count;
  }

  // buildField is passed as a thunk, not called here: createRenderer only
  // invokes it once the WebGL2 capability check (context creation, then
  // the software-renderer check) has actually passed, so a rejected
  // environment never pays for rejection sampling + kNN edges it would
  // just throw away.
  //
  // createRenderer is now async (T4f): it spans several yielded turns
  // (field build, shader compile/link, buffer upload — see its own
  // comment) instead of one synchronous call, which is the whole point —
  // that spread-out window is exactly why a navigation *during* it needs
  // its own abort signal. The render loop's own `disposed` flag and
  // `dispose()` don't exist yet at this point (there is no handle to
  // return one yet), so this temporary flag + listener pair stands in for
  // them until either the mount finishes (and the real ones below take
  // over) or one of these fires first.
  let earlyAbort = false;
  function requestEarlyAbort() {
    earlyAbort = true;
  }
  document.addEventListener("astro:before-swap", requestEarlyAbort, {
    once: true,
  });
  window.addEventListener("pagehide", requestEarlyAbort, { once: true });

  const created: ConvergenceRenderer | null = await createRenderer(
    canvas,
    buildField,
    (success) => {
      // Fires after a `webglcontextrestored` event. On success there is a
      // freshly rebuilt (but not yet drawn) frame waiting — request one
      // through the normal on-demand path, or render the settled static
      // frame directly if motion is reduced (see `refreshFrame`). On
      // failure the renderer already disposed itself; finish tearing down
      // the mount the same way a failed `setField` upload does.
      if (success) {
        refreshFrame();
      } else {
        degradeToFallback();
      }
    },
    () => earlyAbort,
  );

  document.removeEventListener("astro:before-swap", requestEarlyAbort);
  window.removeEventListener("pagehide", requestEarlyAbort);

  if (earlyAbort) {
    // Navigated away mid-mount: createRenderer's own shouldAbort check
    // already stopped the in-flight build, so `created` is null here in
    // practice (JS never interrupts the synchronous tail of `build()`
    // between its last abort check and returning). `created?.dispose()` is
    // defensive belt-and-suspenders, not a documented reachable case.
    created?.dispose();
    canvas.remove();
    return null;
  }
  if (!created) {
    canvas.remove();
    return null;
  }
  // Rebound to a non-nullable local: TypeScript does not carry the null
  // check above into the nested closures below, even though `created` is a
  // `const` that can never become null again.
  const renderer: ConvergenceRenderer = created;

  let colors = readThemeColors();
  let disposed = false;
  let rafId = 0;
  /** True while a frame is already queued — `requestFrame` is idempotent
   * so every trigger (scroll, pointer, resize, theme change) can call it
   * unconditionally without stacking up duplicate rAF callbacks. */
  let scheduled = false;
  let startTime = 0;
  let heroVisible = true;
  let documentVisible = !document.hidden;
  let reducedMotion = reducedMotionQuery?.matches ?? false;
  /** The last progress value actually rendered — compared against the
   * newly computed one each frame to decide whether the field is still
   * visibly changing (see `renderFrame`'s return value). Starts at a value
   * no real progress can equal, so the very first frame always renders. */
  let lastProgress = -1;

  const pointerTarget = { x: 0, y: 0, strength: 0 };
  const pointerSmooth = { x: 0, y: 0, strength: 0 };
  let pointerIdleTimer: ReturnType<typeof setTimeout> | null = null;
  let pointerEnabled = pointerFineQuery?.matches ?? false;

  /** "idle-settled" is distinct from "paused": paused means the browser
   * stopped us (off-screen or tab hidden) and we want to resume the moment
   * that changes; idle-settled means WE stopped scheduling frames on
   * purpose because nothing is animating — see `renderFrame`'s return
   * value and `requestFrame` below. */
  function setState(
    state: "idle" | "running" | "paused" | "static" | "idle-settled",
  ) {
    canvas.dataset.state = state;
  }

  function applyResize() {
    const box = canvas.getBoundingClientRect();
    const width = Math.max(1, box.width || heroEl.clientWidth || 1);
    const height = Math.max(1, box.height || heroEl.clientHeight || 1);
    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    renderer.resize(width, height, dpr);
    aspectScale = computeAspectScale(width, height);
    return dpr;
  }

  /** Reshapes the field around the exclusion rects' current position/size
   * and re-uploads it — cheap relative to a resize event's own cost, and
   * the only way the hub layout can track content that moved (a breakpoint
   * crossing, a font-driven reflow, a window resize). If the GPU upload
   * itself fails, `renderer.setField` has already disposed the renderer —
   * degrade the whole mount to the fallback instead of updating the protect
   * uniform or expecting any further frame to draw. */
  function rebuildField(): boolean {
    layout = isNarrow ? "narrow" : "wide";
    if (!renderer.setField(buildField())) {
      degradeToFallback();
      return false;
    }
    updateProtectUniform();
    return true;
  }

  // Hero geometry cache for scrollProgress, read on mount and on every
  // ResizeObserver firing — never per frame. `heroAbsoluteTop` is the
  // hero's top relative to the *document*, not the viewport, so per-frame
  // scroll progress is just `heroAbsoluteTop - window.scrollY`: a plain
  // arithmetic subtraction against a scroll offset the browser already
  // tracks, instead of a `getBoundingClientRect()` call that forces a
  // synchronous layout recalculation if anything on the page is dirty.
  // That per-frame layout read was the dominant cost behind this field's
  // ~5.4s of measured Lighthouse Total Blocking Time (see renderer.ts's
  // WEBGL_CONTEXT_ATTRIBUTES comment for the other major contributor).
  let heroAbsoluteTop = 0;
  let heroHeight = 0;

  function measureHeroGeometry() {
    const rect = heroEl.getBoundingClientRect();
    heroAbsoluteTop = rect.top + window.scrollY;
    heroHeight = rect.height;
  }

  let currentDpr = applyResize();
  updateProtectUniform();
  measureHeroGeometry();

  function toLogicalPointer(clientX: number, clientY: number) {
    const box = canvas.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) return { x: 0, y: 0 };
    const ndcX = ((clientX - box.left) / box.width) * 2 - 1;
    const ndcY = -(((clientY - box.top) / box.height) * 2 - 1);
    // Inverse of the vertex shader's `pos * uAspect`, so the repulsion
    // radius lines up with where the particles actually render instead of
    // being stretched/squashed relative to the cursor on a wide canvas.
    return { x: ndcX / aspectScale[0], y: ndcY / aspectScale[1] };
  }

  function handlePointerMove(event: PointerEvent) {
    if (!pointerEnabled) return;
    const { x, y } = toLogicalPointer(event.clientX, event.clientY);
    pointerTarget.x = x;
    pointerTarget.y = y;
    pointerTarget.strength = 1;
    requestFrame();
    if (pointerIdleTimer) clearTimeout(pointerIdleTimer);
    pointerIdleTimer = setTimeout(() => {
      pointerTarget.strength = 0;
      requestFrame();
    }, POINTER_IDLE_TIMEOUT_MS);
  }

  function handlePointerLeave() {
    pointerTarget.strength = 0;
    requestFrame();
  }

  if (pointerEnabled) {
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    heroEl.addEventListener("pointerleave", handlePointerLeave, {
      passive: true,
    });
  }

  function handlePointerCapabilityChange() {
    const nowFine = pointerFineQuery?.matches ?? false;
    if (nowFine === pointerEnabled) return;
    pointerEnabled = nowFine;
    if (pointerEnabled) {
      window.addEventListener("pointermove", handlePointerMove, {
        passive: true,
      });
      heroEl.addEventListener("pointerleave", handlePointerLeave, {
        passive: true,
      });
    } else {
      window.removeEventListener("pointermove", handlePointerMove);
      heroEl.removeEventListener("pointerleave", handlePointerLeave);
      pointerTarget.strength = 0;
      requestFrame();
    }
  }
  pointerFineQuery?.addEventListener?.("change", handlePointerCapabilityChange);

  const resizeObserver =
    typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => {
          currentDpr = applyResize();
          isNarrow = window.innerWidth <= NARROW_BREAKPOINT;
          // rebuildField() can itself degrade to the fallback (a failed GPU
          // re-upload) and remove the canvas — measuring hero geometry or
          // asking for a redraw against that torn-down mount afterward would
          // be work with nothing left to consume it, so stop right here
          // instead of relying on the disposed-state guards inside those
          // calls to make it harmless.
          if (!rebuildField()) return;
          measureHeroGeometry();
          // Not requestFrame(): a resize always needs a redraw, including
          // while motion is reduced — see refreshFrame's own comment.
          refreshFrame();
        })
      : null;
  resizeObserver?.observe(heroEl);

  const intersectionObserver =
    typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) heroVisible = entry.isIntersecting;
            syncRunning();
          },
          { threshold: 0.01 },
        )
      : null;
  intersectionObserver?.observe(heroEl);

  function handleVisibilityChange() {
    documentVisible = !document.hidden;
    syncRunning();
  }
  document.addEventListener("visibilitychange", handleVisibilityChange);

  const themeObserver = new MutationObserver(() => {
    colors = readThemeColors();
    // Not requestFrame(): the already-drawn static frame is now the wrong
    // colors while motion is reduced — see refreshFrame's own comment.
    refreshFrame();
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  const colorSchemeQuery =
    typeof window.matchMedia === "function"
      ? window.matchMedia("(prefers-color-scheme: dark)")
      : null;
  function handleColorSchemeChange() {
    colors = readThemeColors();
    // Not requestFrame(): same reasoning as the theme MutationObserver
    // above — refreshFrame() actually redraws the static frame with the
    // new colors instead of no-op'ing while motion is reduced.
    refreshFrame();
  }
  colorSchemeQuery?.addEventListener?.("change", handleColorSchemeChange);

  // Passive scroll listener: does no work itself beyond scheduling one
  // frame. Per-frame scroll progress is read from `window.scrollY` (a
  // cheap scroll-offset read, no layout) against the cached hero geometry
  // above, not recomputed here.
  function handleScroll() {
    requestFrame();
  }
  window.addEventListener("scroll", handleScroll, { passive: true });

  function currentAlpha(): number {
    return isNarrow ? NARROW_ALPHA : WIDE_ALPHA;
  }

  /** Whether the pointer's smoothed position/strength has converged close
   * enough to its target that continuing to animate it would be
   * imperceptible — exponential smoothing only asymptotically reaches its
   * target, so without this the loop would never consider the pointer
   * "done" and would keep scheduling frames forever after a single move. */
  function pointerSettled(): boolean {
    return (
      Math.abs(pointerTarget.x - pointerSmooth.x) < POINTER_EPSILON &&
      Math.abs(pointerTarget.y - pointerSmooth.y) < POINTER_EPSILON &&
      Math.abs(pointerTarget.strength - pointerSmooth.strength) <
        POINTER_EPSILON
    );
  }

  /** Draws one frame and reports whether another one is worth scheduling.
   * Reads only `window.scrollY` / `window.innerHeight` (no layout) against
   * the geometry `measureHeroGeometry` cached on mount/resize — see that
   * function's comment for why a per-frame `getBoundingClientRect()` was
   * the dominant cost this on-demand loop exists to remove. */
  function renderFrame(nowMs: number): boolean {
    const elapsedMs = startTime === 0 ? 0 : nowMs - startTime;
    const heroTop = heroAbsoluteTop - window.scrollY;
    const intro = introProgress(elapsedMs);
    const scroll = scrollProgress(heroTop, heroHeight, window.innerHeight);
    const progress = combineProgress(intro, scroll);

    pointerSmooth.x += (pointerTarget.x - pointerSmooth.x) * POINTER_SMOOTHING;
    pointerSmooth.y += (pointerTarget.y - pointerSmooth.y) * POINTER_SMOOTHING;
    pointerSmooth.strength +=
      (pointerTarget.strength - pointerSmooth.strength) * POINTER_SMOOTHING;

    renderer.render({
      progress,
      time: nowMs / 1000,
      dpr: currentDpr,
      pointer: [pointerSmooth.x, pointerSmooth.y],
      pointerStrength: pointerSmooth.strength,
      idleAmount: 1 - progress,
      accent: colors.accent,
      neutral: colors.neutral,
      alpha: currentAlpha(),
      protectRects: protectRectsUniform,
      protectCount: protectCountUniform,
    });

    // "Still animating" if the visible progress moved since the last frame
    // (the intro easing, an in-progress scroll, or a settling pointer can
    // all move it) or the pointer hasn't caught up to its target yet. Once
    // both are false the field is visually static, and scheduling another
    // frame would just redraw the same pixels — see requestFrame/loop.
    const stillChanging = Math.abs(progress - lastProgress) > PROGRESS_EPSILON;
    lastProgress = progress;
    return stillChanging || !pointerSettled();
  }

  function loop(nowMs: number) {
    scheduled = false;
    rafId = 0;
    if (disposed) return;
    if (!(heroVisible && documentVisible)) {
      // Defensive: the visibility/intersection handlers already cancel a
      // pending frame the instant they flip false, but a frame already in
      // flight can still land here in the same tick.
      setState("paused");
      return;
    }
    if (startTime === 0) startTime = nowMs;
    const stillAnimating = renderFrame(nowMs);
    if (stillAnimating) {
      setState("running");
      requestFrame();
    } else {
      // Nothing left to animate: stop scheduling entirely rather than
      // polling every frame to confirm nothing changed. The canvas simply
      // keeps showing its last-drawn pixels (a WebGL context's drawing
      // buffer persists between frames) — including the hub pulse, which
      // freezes at whatever phase it was mid-cycle instead of continuing
      // to breathe forever. A calm, settled system matches the "chaos
      // resolves into structure" intent better than perpetual motion would,
      // and it's what actually makes "on demand" mean zero scheduled work
      // at rest instead of a throttled-but-still-ticking timer.
      setState("idle-settled");
    }
  }

  /** The only place a frame gets scheduled. Idempotent — every trigger
   * (scroll, pointer move/settle, resize, theme change, becoming visible
   * again) calls this unconditionally; `scheduled` makes repeat calls
   * within the same pending frame a no-op instead of stacking up queued
   * rAF callbacks. */
  function requestFrame() {
    if (disposed || reducedMotion || scheduled) return;
    if (!(heroVisible && documentVisible)) return;
    scheduled = true;
    rafId = requestAnimationFrame(loop);
  }

  function syncRunning() {
    if (disposed || reducedMotion) return;
    const shouldRun = heroVisible && documentVisible;
    if (shouldRun) {
      // Becoming visible again after being paused: the scroll position or
      // pointer state may have changed while nothing was drawing, so
      // always resync with one frame instead of waiting for another
      // trigger that may never come.
      requestFrame();
    } else {
      // Not visible: report "paused" even if we had already settled to
      // idle, so the reason we're not running (visibility, not "nothing
      // changed") stays observable — and cancel any frame that was still
      // in flight from a trigger that fired just before this one did.
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      scheduled = false;
      setState("paused");
    }
  }

  function renderStaticFrame() {
    renderer.render({
      progress: 1,
      time: 0,
      dpr: currentDpr,
      pointer: [0, 0],
      pointerStrength: 0,
      idleAmount: 0,
      accent: colors.accent,
      neutral: colors.neutral,
      alpha: currentAlpha(),
      protectRects: protectRectsUniform,
      protectCount: protectCountUniform,
    });
  }

  /** The one place every trigger that can change what should be on screen
   * while motion is reduced — resize (rebuildField already reshapes the
   * field, but resize also resizes/clears the GL drawing buffer itself),
   * a theme toggle, or an OS-level color-scheme change — funnels through.
   * `requestFrame` alone is not enough here: it unconditionally no-ops
   * while `reducedMotion` is true (see its own guard), which is correct
   * for scroll/pointer (nothing should animate) but wrong for these three,
   * since each one invalidates the single static frame already drawn
   * (a cleared buffer after resize, or stale colors after a theme change)
   * without anything else ever asking for a redraw. */
  function refreshFrame() {
    if (reducedMotion) {
      renderStaticFrame();
    } else {
      requestFrame();
    }
  }

  function handleReducedMotionChange() {
    reducedMotion = reducedMotionQuery?.matches ?? false;
    if (reducedMotion) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      scheduled = false;
      setState("static");
      renderStaticFrame();
    } else {
      // Restart the intro so re-enabling motion still reads as a
      // convergence rather than snapping straight to the settled graph.
      startTime = 0;
      lastProgress = -1;
      syncRunning();
    }
  }
  reducedMotionQuery?.addEventListener?.("change", handleReducedMotionChange);

  if (reducedMotion) {
    setState("static");
    renderStaticFrame();
  } else {
    setState("idle");
    syncRunning();
  }

  /** Tears the whole mount down and removes the canvas — the same fallback
   * a capability check failing at mount time already takes (see
   * `mountConvergenceField`'s catch, and the `earlyAbort` and `!created`
   * branches above), reused here for the two failures that can only be
   * discovered later: a context-restore rebuild that fails, or a `setField`
   * re-upload that fails. Both leave the renderer already disposed; this finishes
   * the job by disconnecting every observer/listener and removing the now
   * permanently-blank canvas, matching "no WebGL2 at all" from the
   * visitor's point of view instead of leaving an inert, frozen surface. */
  function degradeToFallback() {
    dispose();
    canvas.remove();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (rafId) cancelAnimationFrame(rafId);
    if (pointerIdleTimer) clearTimeout(pointerIdleTimer);
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    themeObserver.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("pointermove", handlePointerMove);
    heroEl.removeEventListener("pointerleave", handlePointerLeave);
    pointerFineQuery?.removeEventListener?.(
      "change",
      handlePointerCapabilityChange,
    );
    reducedMotionQuery?.removeEventListener?.(
      "change",
      handleReducedMotionChange,
    );
    colorSchemeQuery?.removeEventListener?.("change", handleColorSchemeChange);
    document.removeEventListener("astro:before-swap", dispose);
    window.removeEventListener("pagehide", dispose);
    renderer.dispose();
  }

  document.addEventListener("astro:before-swap", dispose, { once: true });
  window.addEventListener("pagehide", dispose, { once: true });

  return { dispose };
}
