/**
 * Progressive-enhancement carousel controller for `#project-track`.
 * Arrows move one visible card at a time (wrapping at both ends); filter chips
 * narrow visible cards and update the live `01 / NN` counter dynamically.
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
    const total = root.querySelector<HTMLElement>("[data-carousel-total]");
    const filterButtons = Array.from(
      root.querySelectorAll<HTMLButtonElement>("[data-carousel-filter]"),
    );
    if (!track || !controls || !prev || !next || !index) return;
    const allCards = Array.from(track.children) as HTMLElement[];
    if (allCards.length === 0) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pad = (n: number) => String(n).padStart(2, "0");

    const visibleCards = () => allCards.filter((card) => !card.hidden);
    const current = () => {
      const cards = visibleCards();
      if (cards.length === 0) return 0;
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
      const cards = visibleCards();
      if (total) total.textContent = pad(cards.length);
      if (cards.length === 0) {
        index.textContent = "00";
        return;
      }
      const i = atEnd() ? cards.length - 1 : current();
      index.textContent = pad(i + 1);
    };
    const go = (step: number) => {
      const cards = visibleCards();
      if (cards.length === 0) return;
      let i = current() + step;
      if (step > 0 && atEnd()) i = 0;
      else if (step < 0 && atStart()) i = cards.length - 1;
      const target = cards[Math.min(cards.length - 1, Math.max(0, i))];
      track.scrollTo({
        left: target.offsetLeft - cards[0].offsetLeft,
        behavior: calm.matches ? "instant" : "smooth",
      });
    };

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.carouselFilter ?? "all";
        filterButtons.forEach((b) =>
          b.setAttribute("aria-pressed", String(b === btn)),
        );
        allCards.forEach((card) => {
          const tags = (card.dataset.filters ?? "").split(/\s+/);
          card.hidden = key !== "all" && !tags.includes(key);
        });
        track.scrollTo({ left: 0, behavior: "instant" });
        sync();
      });
    });

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
