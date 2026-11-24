import {
  shouldAutoplayRun,
  type AutoplayConditions,
  type AutoplayController,
  type AutoplayHooks,
} from "./project-autoplay-state.ts";

export {
  nextActiveIndex,
  shouldAutoplayRun,
  type AutoplayConditions,
  type AutoplayController,
  type AutoplayHooks,
} from "./project-autoplay-state.ts";

const DEFAULT_INTERVAL_MS = 5200;

export function createCarouselAutoplay(
  root: HTMLElement,
  hooks: AutoplayHooks,
): AutoplayController {
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const toggleBtn = root.querySelector<HTMLButtonElement>(
    "[data-carousel-autoplay-toggle]",
  );
  const parsedMs = Number(root.dataset.autoplayMs);
  const intervalMs =
    hooks.intervalMs ??
    (Number.isFinite(parsedMs) && parsedMs >= 200
      ? parsedMs
      : DEFAULT_INTERVAL_MS);

  const state: AutoplayConditions = {
    reducedMotion: reducedQuery.matches,
    inView: true,
    documentVisible: !document.hidden,
    hovered: false,
    focused: false,
    pausedByUser: false,
    itemCount: hooks.getVisibleCount(),
  };

  let externalPaused = false;
  let timerId: number | null = null;
  let tickFlip = false;

  const clearTimer = () => {
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
  };

  const syncToggle = (running: boolean) => {
    if (!toggleBtn) return;
    const paused = state.pausedByUser || state.reducedMotion;
    toggleBtn.setAttribute("aria-pressed", String(!paused));
    toggleBtn.dataset.state = running ? "running" : "paused";
    const label = toggleBtn.querySelector<HTMLElement>("[data-autoplay-label]");
    if (label) label.textContent = paused ? "Pausado" : "Auto";
  };

  const schedule = () => {
    clearTimer();
    state.itemCount = hooks.getVisibleCount();
    const running = !externalPaused && shouldAutoplayRun(state);
    root.dataset.autoplayState = state.reducedMotion
      ? "reduced"
      : running
        ? "running"
        : "paused";
    syncToggle(running);
    if (!running) return;
    tickFlip = !tickFlip;
    root.classList.toggle("autoplay-tick-a", tickFlip);
    root.classList.toggle("autoplay-tick-b", !tickFlip);
    timerId = window.setTimeout(() => {
      hooks.advance();
      schedule();
    }, intervalMs);
  };

  const setAndSchedule = (patch: () => void) => () => {
    patch();
    schedule();
  };

  const listeners: Array<
    [EventTarget, string, EventListener, AddEventListenerOptions?]
  > = [
    [root, "pointerenter", setAndSchedule(() => (state.hovered = true))],
    [root, "pointerleave", setAndSchedule(() => (state.hovered = false))],
    [
      root,
      "touchstart",
      (event) => {
        if (
          toggleBtn &&
          event.target instanceof Node &&
          toggleBtn.contains(event.target)
        ) {
          return;
        }
        state.pausedByUser = true;
        schedule();
      },
      { passive: true },
    ],
    [root, "focusin", setAndSchedule(() => (state.focused = true))],
    [
      root,
      "focusout",
      (event) => {
        const next = (event as FocusEvent).relatedTarget as Node | null;
        if (!next || !root.contains(next)) {
          state.focused = false;
          schedule();
        }
      },
    ],
    [
      document,
      "visibilitychange",
      setAndSchedule(() => (state.documentVisible = !document.hidden)),
    ],
    [
      reducedQuery,
      "change",
      (event) => {
        state.reducedMotion = (event as MediaQueryListEvent).matches;
        schedule();
      },
    ],
    [
      window,
      "dreamfolio:autoplay-pause",
      setAndSchedule(() => (externalPaused = true)),
    ],
    [
      window,
      "dreamfolio:autoplay-resume",
      setAndSchedule(() => (externalPaused = false)),
    ],
  ];
  if (toggleBtn) {
    listeners.push([
      toggleBtn,
      "click",
      setAndSchedule(() => (state.pausedByUser = !state.pausedByUser)),
    ]);
  }

  let observer: IntersectionObserver | null = null;
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        state.inView = entry.isIntersecting;
        schedule();
      },
      { threshold: 0.25 },
    );
    observer.observe(root);
  }

  for (const [target, type, fn, opts] of listeners) {
    target.addEventListener(type, fn, opts);
  }
  schedule();

  return {
    refresh: schedule,
    reset: () => {
      clearTimer();
      schedule();
    },
    setExternalPause: (paused: boolean) => {
      externalPaused = paused;
      schedule();
    },
    destroy: () => {
      clearTimer();
      observer?.disconnect();
      for (const [target, type, fn] of listeners) {
        target.removeEventListener(type, fn);
      }
    },
  };
}
