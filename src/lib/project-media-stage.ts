export type MediaStageView = "split" | "video" | "image";

export function normalizeMediaView(value?: string): MediaStageView {
  if (value === "video" || value === "image" || value === "split") {
    return value;
  }
  return "split";
}

export function isPortrait(width: number, height: number): boolean {
  return width > 0 && height > width;
}

export function resolveStageVideo(input: {
  showcaseVideo?: string;
  previewVideo?: string;
}): string | null {
  return input.showcaseVideo || input.previewVideo || null;
}

export function mountProjectMediaStages(): void {
  document
    .querySelectorAll<HTMLElement>("[data-media-stage]")
    .forEach((stage) => {
      const buttons = Array.from(
        stage.querySelectorAll<HTMLButtonElement>("[data-media-view-btn]"),
      );
      const video = stage.querySelector<HTMLVideoElement>("[data-stage-video]");
      const mainImg =
        stage.querySelector<HTMLImageElement>("[data-stage-image]");
      // Phone screenshots are letterboxed instead of cropped to 16:10.
      mainImg?.addEventListener("load", () => {
        mainImg.dataset.portrait = String(
          isPortrait(mainImg.naturalWidth, mainImg.naturalHeight),
        );
      });
      const thumbs = Array.from(
        stage.querySelectorAll<HTMLButtonElement>("[data-stage-thumb]"),
      );
      const lightbox = stage.querySelector<HTMLDialogElement>(
        "[data-media-lightbox]",
      );
      const lightboxImg = lightbox?.querySelector<HTMLImageElement>(
        "[data-lightbox-image]",
      );
      const lightboxCaption = lightbox?.querySelector<HTMLElement>(
        "[data-lightbox-caption]",
      );
      const openBtn = stage.querySelector<HTMLButtonElement>(
        "[data-lightbox-open]",
      );
      const closeBtn = lightbox?.querySelector<HTMLButtonElement>(
        "[data-lightbox-close]",
      );

      const setView = (next: MediaStageView) => {
        stage.dataset.mediaView = next;
        buttons.forEach((btn) => {
          btn.setAttribute(
            "aria-pressed",
            String(btn.dataset.mediaViewBtn === next),
          );
        });
        if (next === "image" && video && !video.paused) {
          video.pause();
        }
      };

      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          setView(normalizeMediaView(btn.dataset.mediaViewBtn));
        });
      });

      thumbs.forEach((thumb) => {
        thumb.addEventListener("click", () => {
          const src = thumb.dataset.thumbSrc;
          const alt = thumb.dataset.thumbAlt ?? "";
          if (!src || !mainImg) return;
          mainImg.src = src;
          mainImg.alt = alt;
          thumbs.forEach((t) =>
            t.setAttribute("aria-pressed", String(t === thumb)),
          );
        });
      });

      openBtn?.addEventListener("click", () => {
        if (!lightbox || !lightboxImg || !mainImg) return;
        lightboxImg.src = mainImg.src;
        lightboxImg.alt = mainImg.alt;
        if (lightboxCaption) lightboxCaption.textContent = mainImg.alt;
        if (video && !video.paused) video.pause();
        lightbox.showModal();
      });

      closeBtn?.addEventListener("click", () => lightbox?.close());
      lightbox?.addEventListener("click", (event) => {
        if (event.target === lightbox) lightbox.close();
      });
    });
}
