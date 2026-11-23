/**
 * Progressive-enhancement carousel controller for `#project-track`.
 * Arrows move one card at a time (wrapping at both ends); the counter follows
 * any scroll (arrow, swipe, trackpad, or keyboard) and respects reduced motion.
 */
export function mountProjectCarousels(): void {
  document.querySelectorAll<HTMLElement>("[data-carousel]").forEach((root) => {
    const track = root.querySelector<HTMLElement>("[data-carousel-track]");
    const controls = root.querySelector<HTMLElement>(
      "[data-carousel-controls]",
    );
    const prev = root.querySelector<HTMLButtonElement>("[data-carousel-prev]");
    const next = root.querySelector<HTMLButtonElement>("[data-carousel-next]");
    const index = root.querySelector<HTMLElement>("[data-carousel-index]");
    if (!track || !controls || !prev || !next || !index) return;
    const cards = Array.from(track.children) as HTMLElement[];
    if (cards.length === 0) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");

    const current = () => {
      const left = track.scrollLeft + cards[0].offsetLeft;
      let best = 0;
      cards.forEach((card, i) => {
        const d = Math.abs(card.offsetLeft - left);
        if (d < Math.abs(cards[best].offsetLeft - left)) best = i;
      });
      return best;
    };
    const atEnd = () =>
      track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    const atStart = () => track.scrollLeft <= 4;
    const sync = () => {
      const i = atEnd() ? cards.length - 1 : current();
      index.textContent = String(i + 1).padStart(2, "0");
    };
    const go = (step: number) => {
      let i = current() + step;
      if (step > 0 && atEnd()) i = 0;
      else if (step < 0 && atStart()) i = cards.length - 1;
      const target = cards[Math.min(cards.length - 1, Math.max(0, i))];
      track.scrollTo({
        left: target.offsetLeft - cards[0].offsetLeft,
        behavior: calm.matches ? "instant" : "smooth",
      });
    };

    prev.addEventListener("click", () => go(-1));
    next.addEventListener("click", () => go(1));
    track.addEventListener("keydown", (event) => {
      if (event.target !== track) return;
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        go(event.key === "ArrowRight" ? 1 : -1);
      }
    });
    track.addEventListener("scroll", sync, { passive: true });
    controls.hidden = false;
    sync();
  });
}
