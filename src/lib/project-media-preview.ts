export interface PreviewSelectionInput {
  reducedMotion: boolean;
  hoveredId: string | null;
  activeId: string | null;
}

export function pickPreviewVideoId(input: PreviewSelectionInput): string | null {
  if (input.reducedMotion) return null;
  return input.hoveredId ?? input.activeId;
}

/**
 * Single-active-video controller for `.project-card` living previews.
 * Lazy-loads video `src` only when a card becomes active or hovered, ensuring
 * at most one preview plays at a time and zero video bytes load off-focus.
 */
export function mountProjectMediaPreviews(root: HTMLElement): () => void {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const cards = Array.from(root.querySelectorAll<HTMLElement>(".project-card"));
  let activeId: string | null =
    cards.find((c) => c.dataset.active === "true")?.dataset.projectId ?? null;
  let hoveredId: string | null = null;

  const syncVideos = () => {
    const targetId = pickPreviewVideoId({
      reducedMotion: reduced.matches,
      hoveredId,
      activeId,
    });
    for (const card of cards) {
      const video = card.querySelector<HTMLVideoElement>("[data-preview-video]");
      if (!video) continue;
      const shouldPlay = Boolean(targetId && card.dataset.projectId === targetId);
      if (shouldPlay) {
        const src = video.dataset.previewVideo;
        if (src && !video.getAttribute("src")) {
          video.setAttribute("src", src);
        }
        const playResult = video.play();
        if (playResult && typeof playResult.then === "function") {
          playResult
            .then(() => {
              video.dataset.playing = "true";
            })
            .catch(() => {
              video.dataset.playing = "false";
            });
        } else {
          video.dataset.playing = "true";
        }
      } else {
        if (!video.paused) video.pause();
        video.dataset.playing = "false";
      }
    }
  };

  const onActiveChange = (event: Event) => {
    const detail = (event as CustomEvent<{ card: HTMLElement | null }>).detail;
    activeId = detail?.card?.dataset.projectId ?? null;
    syncVideos();
  };

  const onEnter = (event: Event) => {
    const card = (event.currentTarget as HTMLElement | null);
    hoveredId = card?.dataset.projectId ?? null;
    syncVideos();
  };

  const onLeave = () => {
    hoveredId = null;
    syncVideos();
  };

  const onReducedChange = () => syncVideos();

  root.addEventListener("carousel:active-change", onActiveChange);
  reduced.addEventListener("change", onReducedChange);
  cards.forEach((card) => {
    card.addEventListener("pointerenter", onEnter);
    card.addEventListener("pointerleave", onLeave);
  });

  syncVideos();

  return () => {
    root.removeEventListener("carousel:active-change", onActiveChange);
    reduced.removeEventListener("change", onReducedChange);
    cards.forEach((card) => {
      card.removeEventListener("pointerenter", onEnter);
      card.removeEventListener("pointerleave", onLeave);
    });
  };
}
