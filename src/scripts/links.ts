/**
 * Progressive enhancement for DreamCoder Links.
 * Links remain regular anchors and all remain visible with JavaScript disabled.
 */
const page = document.querySelector<HTMLElement>(".links-page");
if (page) {
  const filters = Array.from(
    page.querySelectorAll<HTMLButtonElement>("[data-filter]"),
  );
  const cards = Array.from(
    page.querySelectorAll<HTMLAnchorElement>("[data-link-kind]"),
  );
  const empty = page.querySelector<HTMLElement>("[data-links-empty]");
  const feedback = page.querySelector<HTMLElement>("[data-links-feedback]");
  const copyButton = page.querySelector<HTMLButtonElement>("[data-links-copy]");
  const shareButton =
    page.querySelector<HTMLButtonElement>("[data-links-share]");

  const linkToShare = () => {
    const url = new URL(window.location.href);
    url.hash = "";
    return url.toString();
  };

  const announce = (message: string) => {
    if (feedback) feedback.textContent = message;
  };

  async function copyLink() {
    if (!navigator.clipboard?.writeText) {
      announce("Copia la dirección desde la barra de tu navegador.");
      return;
    }
    try {
      await navigator.clipboard.writeText(linkToShare());
      announce("¡Enlace copiado!");
    } catch {
      announce("No se pudo copiar. Utiliza el botón Compartir.");
    }
  }

  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      const selected = filter.dataset.filter ?? "all";
      filters.forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.filter === selected),
        ),
      );
      let visible = 0;
      cards.forEach((card) => {
        const kinds = (card.dataset.linkKind ?? "").split(/\s+/);
        const show = selected === "all" || kinds.includes(selected);
        card.hidden = !show;
        if (show) visible++;
      });
      if (empty) empty.hidden = visible !== 0;
      announce("");
    });
  });

  copyButton?.addEventListener("click", () => {
    void copyLink();
  });

  shareButton?.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "DreamCoder — Work & Projects",
          text: "Explore DreamCoder's work and projects.",
          url: linkToShare(),
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
      }
    }
    await copyLink();
  });

  page.classList.add("links-ready");
}
