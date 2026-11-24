export interface TourStop {
  id: string;
  selector: string;
  dwellMs: number;
}

export const TOUR_STOPS: readonly TourStop[] = [
  { id: "hero", selector: ".hero", dwellMs: 3600 },
  { id: "projects", selector: "#projects", dwellMs: 9000 },
  { id: "services", selector: "#services", dwellMs: 4200 },
  { id: "process", selector: "#process", dwellMs: 4200 },
  { id: "about", selector: "#about", dwellMs: 4200 },
  { id: "connect", selector: "#connect", dwellMs: 4000 },
];

export function nextTourStep(current: number, length: number): number | null {
  if (length <= 0 || current + 1 >= length) return null;
  return current + 1;
}

const ABORT_KEYS = new Set([
  "Escape",
  "ArrowDown",
  "ArrowUp",
  "PageDown",
  "PageUp",
  "Home",
  "End",
  " ",
]);

export function isAbortKey(key: string): boolean {
  return ABORT_KEYS.has(key);
}

/**
 * Optional global autonomous presentation ("Modo Reel").
 * Glides smoothly through each homepage chapter, pausing longer on `#projects`
 * so the autonomous carousel can showcase works, and aborts instantaneously on
 * any manual scroll, touch, pointer, or keyboard input.
 */
export function mountAutoTour(): void {
  const toggle = document.querySelector<HTMLButtonElement>("[data-tour-toggle]");
  if (!toggle) return;

  const stops = TOUR_STOPS.map((stop) => ({
    ...stop,
    el: document.querySelector<HTMLElement>(stop.selector),
  })).filter((stop): stop is TourStop & { el: HTMLElement } => Boolean(stop.el));

  if (stops.length < 2) return;
  toggle.hidden = false;

  const label = toggle.querySelector<HTMLElement>("[data-tour-label]");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let active = false;
  let stepIndex = 0;
  let timerId: number | null = null;

  const syncUi = () => {
    toggle.dataset.tourActive = String(active);
    toggle.setAttribute("aria-pressed", String(active));
    toggle.setAttribute(
      "aria-label",
      active
        ? "Detener presentación autónoma del portafolio"
        : "Iniciar presentación autónoma del portafolio",
    );
    if (label) label.textContent = active ? "Detener Reel" : "Modo Reel";
    document.documentElement.dataset.autoTour = active ? "running" : "idle";
  };

  const stop = () => {
    if (!active && timerId === null) return;
    active = false;
    if (timerId !== null) {
      window.clearTimeout(timerId);
      timerId = null;
    }
    syncUi();
  };

  const runStep = (index: number) => {
    if (!active) return;
    const stopItem = stops[index];
    if (!stopItem) {
      stop();
      return;
    }
    stepIndex = index;
    stopItem.el.scrollIntoView({
      behavior: reduced.matches ? "instant" : "smooth",
      block: "start",
    });
    timerId = window.setTimeout(() => {
      const next = nextTourStep(stepIndex, stops.length);
      if (next === null) {
        stop();
      } else {
        runStep(next);
      }
    }, stopItem.dwellMs);
  };

  const start = () => {
    if (active) return;
    active = true;
    syncUi();
    runStep(0);
  };

  const toggleTour = () => (active ? stop() : start());

  toggle.addEventListener("click", toggleTour);
  window.addEventListener("dreamfolio:tour-toggle", toggleTour);

  const onManualInput = (event: Event) => {
    if (!active) return;
    if (event.type === "pointerdown") {
      const target = event.target as Node | null;
      if (target && toggle.contains(target)) return;
    }
    if (event.type === "keydown") {
      if (!isAbortKey((event as KeyboardEvent).key)) return;
    }
    stop();
  };

  window.addEventListener("wheel", onManualInput, { passive: true });
  window.addEventListener("touchstart", onManualInput, { passive: true });
  window.addEventListener("pointerdown", onManualInput, { passive: true });
  window.addEventListener("keydown", onManualInput);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && active) stop();
  });

  syncUi();
}
