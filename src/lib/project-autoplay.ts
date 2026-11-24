export interface AutoplayConditions {
  reducedMotion: boolean;
  inView: boolean;
  documentVisible: boolean;
  hovered: boolean;
  focused: boolean;
  pausedByUser: boolean;
  itemCount: number;
}

export function shouldAutoplayRun(c: AutoplayConditions): boolean {
  return (
    !c.reducedMotion &&
    c.inView &&
    c.documentVisible &&
    !c.hovered &&
    !c.focused &&
    !c.pausedByUser &&
    c.itemCount > 1
  );
}

export function nextActiveIndex(current: number, count: number): number {
  if (count <= 1) return 0;
  return (current + 1) % count;
}

export interface AutoplayHooks {
  advance: () => void;
  getVisibleCount: () => number;
  intervalMs?: number;
}

export interface AutoplayController {
  refresh: () => void;
  reset: () => void;
  setExternalPause: (paused: boolean) => void;
  destroy: () => void;
}

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

  const flipTick = () => {
    tickFlip = !tickFlip;
    root.classList.toggle("autoplay-tick-a", tickFlip);
    root.classList.toggle("autoplay-tick-b", !tickFlip);
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
    flipTick();
    timerId = window.setTimeout(() => {
      hooks.advance();
      schedule();
    }, intervalMs);
  };

  const onEnter = () => {
    state.hovered = true;
    schedule();
  };
  const onLeave = () => {
    state.hovered = false;
    schedule();
  };
  const onFocusIn = () => {
    state.focused = true;
    schedule();
  };
  const onFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (!next || !root.contains(next)) {
      state.focused = false;
      schedule();
    }
  };
  const onVisibility = () => {
    state.documentVisible = !document.hidden;
    schedule();
  };
  const onReducedChange = (event: MediaQueryListEvent) => {
    state.reducedMotion = event.matches;
    schedule();
  };
  const onToggleClick = () => {
    state.pausedByUser = !state.pausedByUser;
    schedule();
  };
  const onExternalPause = () => {
    externalPaused = true;
    schedule();
  };
  const onExternalResume = () => {
    externalPaused = false;
    schedule();
  };

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

  root.addEventListener("pointerenter", onEnter);
  root.addEventListener("pointerleave", onLeave);
  root.addEventListener("focusin", onFocusIn);
  root.addEventListener("focusout", onFocusOut);
  toggleBtn?.addEventListener("click", onToggleClick);
  document.addEventListener("visibilitychange", onVisibility);
  reducedQuery.addEventListener("change", onReducedChange);
  window.addEventListener("dreamfolio:autoplay-pause", onExternalPause);
  window.addEventListener("dreamfolio:autoplay-resume", onExternalResume);

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
      root.removeEventListener("pointerenter", onEnter);
      root.removeEventListener("pointerleave", onLeave);
      root.removeEventListener("focusin", onFocusIn);
      root.removeEventListener("focusout", onFocusOut);
      toggleBtn?.removeEventListener("click", onToggleClick);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedQuery.removeEventListener("change", onReducedChange);
      window.removeEventListener("dreamfolio:autoplay-pause", onExternalPause);
      window.removeEventListener("dreamfolio:autoplay-resume", onExternalResume);
    },
  };
}
