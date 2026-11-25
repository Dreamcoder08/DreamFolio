export interface SceneChapter {
  id: string;
  selector: string;
  code: string;
  label: string;
}

export const SCENE_CHAPTERS: readonly SceneChapter[] = [
  { id: "hero", selector: ".hero", code: "01", label: "Intro" },
  { id: "projects", selector: "#projects", code: "02", label: "Obras" },
  { id: "services", selector: "#services", code: "03", label: "Servicios" },
  { id: "process", selector: "#process", code: "04", label: "Proceso" },
  { id: "about", selector: "#about", code: "05", label: "Perfil" },
  { id: "connect", selector: "#connect", code: "06", label: "Contacto" },
];

export function findChapterById(id: string): SceneChapter | undefined {
  return SCENE_CHAPTERS.find((chapter) => chapter.id === id);
}

export interface SceneRatio {
  id: string;
  intersecting: boolean;
  ratio: number;
}

export function pickDominantScene(
  entries: readonly SceneRatio[],
): string | null {
  let winner: SceneRatio | null = null;
  for (const entry of entries) {
    if (!entry.intersecting) continue;
    if (!winner || entry.ratio > winner.ratio) {
      winner = entry;
    }
  }
  return winner?.id ?? null;
}

/**
 * Tracks the currently active homepage chapter while scrolling and syncs:
 * - `html[data-active-scene]` for scene-aware atmospheric styling
 * - the navbar chapter indicator (`[data-chapter-indicator]`)
 * - active nav link `aria-current="location"`
 */
export function mountScrollDirector(): void {
  const pairs = SCENE_CHAPTERS.map((chapter) => ({
    chapter,
    el: document.querySelector<HTMLElement>(chapter.selector),
  })).filter((pair): pair is { chapter: SceneChapter; el: HTMLElement } =>
    Boolean(pair.el),
  );

  if (pairs.length === 0) return;

  const indicator = document.querySelector<HTMLElement>(
    "[data-chapter-indicator]",
  );
  const navLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>(".desktop-nav a[href*='#']"),
  );

  const applyScene = (id: string) => {
    const chapter = findChapterById(id);
    if (!chapter) return;
    document.documentElement.dataset.activeScene = chapter.id;
    if (indicator) {
      indicator.hidden = false;
      indicator.textContent = `${chapter.code} · ${chapter.label}`;
    }
    navLinks.forEach((link) => {
      const hash = link.getAttribute("href")?.split("#")[1];
      if (hash === chapter.id) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  applyScene(pairs[0].chapter.id);

  if (!("IntersectionObserver" in window)) return;

  const ratios = new Map<string, SceneRatio>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const match = pairs.find((p) => p.el === entry.target);
        if (!match) continue;
        ratios.set(match.chapter.id, {
          id: match.chapter.id,
          intersecting: entry.isIntersecting,
          ratio: entry.intersectionRatio,
        });
      }
      const next = pickDominantScene(Array.from(ratios.values()));
      if (next) applyScene(next);
    },
    {
      threshold: [0.15, 0.35, 0.6],
      rootMargin: "-18% 0px -32% 0px",
    },
  );

  pairs.forEach(({ el }) => observer.observe(el));
}
