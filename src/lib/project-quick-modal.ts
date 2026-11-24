export interface QuickProjectPayload {
  id: string;
  title: string;
  summary: string;
  eyebrow: string;
  stack: string[];
  githubUrl?: string;
  liveUrl?: string;
  archifyHref?: string;
  coverSrc?: string;
  videoSrc?: string;
  videoCaption?: string;
}

export function parseQuickProjects(
  raw: string | null | undefined,
): Map<string, QuickProjectPayload> {
  const map = new Map<string, QuickProjectPayload>();
  if (!raw) return map;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return map;
    for (const item of parsed) {
      if (item && typeof item.id === "string") {
        map.set(item.id, item as QuickProjectPayload);
      }
    }
  } catch {
    return map;
  }
  return map;
}

function setLink(el: HTMLAnchorElement | null, href?: string): void {
  if (!el) return;
  if (href) {
    el.href = href;
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

export function mountProjectQuickModal(): void {
  const dialog = document.querySelector<HTMLDialogElement>(
    "[data-project-quick-modal]",
  );
  const dataEl = document.querySelector<HTMLScriptElement>(
    "[data-quick-projects-json]",
  );
  if (!dialog || !dataEl) return;

  const projects = parseQuickProjects(dataEl.textContent);
  if (projects.size === 0) return;

  const eyebrow = dialog.querySelector<HTMLElement>("[data-qm-eyebrow]");
  const title = dialog.querySelector<HTMLElement>("[data-qm-title]");
  const summary = dialog.querySelector<HTMLElement>("[data-qm-summary]");
  const stackEl = dialog.querySelector<HTMLElement>("[data-qm-stack]");
  const img = dialog.querySelector<HTMLImageElement>("[data-qm-image]");
  const imgFallback = dialog.querySelector<HTMLElement>(
    "[data-qm-image-fallback]",
  );
  const video = dialog.querySelector<HTMLVideoElement>("[data-qm-video]");
  const videoPlaceholder = dialog.querySelector<HTMLElement>(
    "[data-qm-video-placeholder]",
  );
  const videoCaption = dialog.querySelector<HTMLElement>(
    "[data-qm-video-caption]",
  );
  const githubLink = dialog.querySelector<HTMLAnchorElement>("[data-qm-github]");
  const liveLink = dialog.querySelector<HTMLAnchorElement>("[data-qm-live]");
  const archifyLink =
    dialog.querySelector<HTMLAnchorElement>("[data-qm-archify]");
  const closeBtn = dialog.querySelector<HTMLButtonElement>("[data-qm-close]");

  const openProject = (item: QuickProjectPayload) => {
    if (eyebrow) eyebrow.textContent = item.eyebrow;
    if (title) title.textContent = item.title;
    if (summary) summary.textContent = item.summary;
    if (stackEl) {
      stackEl.replaceChildren(
        ...item.stack.map((tag) => {
          const span = document.createElement("span");
          span.textContent = tag;
          return span;
        }),
      );
    }
    if (img && imgFallback) {
      if (item.coverSrc) {
        img.src = item.coverSrc;
        img.alt = item.title;
        img.hidden = false;
        imgFallback.hidden = true;
      } else {
        img.hidden = true;
        imgFallback.textContent = item.title;
        imgFallback.hidden = false;
      }
    }
    if (video && videoPlaceholder) {
      if (item.videoSrc) {
        video.src = item.videoSrc;
        if (item.coverSrc) video.poster = item.coverSrc;
        video.hidden = false;
        videoPlaceholder.hidden = true;
      } else {
        video.pause();
        video.removeAttribute("src");
        video.hidden = true;
        videoPlaceholder.hidden = false;
      }
    }
    if (videoCaption) {
      videoCaption.textContent =
        item.videoCaption ||
        "Espacio dedicado para el video demo de este repositorio.";
    }
    setLink(githubLink, item.githubUrl);
    setLink(liveLink, item.liveUrl);
    setLink(archifyLink, item.archifyHref);

    window.dispatchEvent(new CustomEvent("dreamfolio:autoplay-pause"));
    dialog.showModal();
  };

  document.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    const target = event.target as HTMLElement | null;
    const trigger = target?.closest<HTMLElement>("[data-quick-view-trigger]");
    const id = trigger?.dataset.quickViewTrigger;
    if (!id) return;
    const item = projects.get(id);
    if (!item) return;
    event.preventDefault();
    openProject(item);
  });

  const handleClose = () => {
    if (video && !video.paused) video.pause();
    window.dispatchEvent(new CustomEvent("dreamfolio:autoplay-resume"));
  };

  closeBtn?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", handleClose);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}
