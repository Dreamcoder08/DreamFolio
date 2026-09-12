/**
 * Applies the stored theme before the page paints.
 *
 * Loaded as a blocking classic script from <head>. It stays a separate file
 * rather than an inline script because Astro does not hash `is:inline` scripts
 * for its Content-Security-Policy: an inline version is silently blocked by
 * the policy, which is worse than useless because the page still renders and
 * only the theme flashes. A same-origin file needs no hash at all.
 *
 * The theme key and colours also appear in src/components/ui/Navbar.astro,
 * which handles the toggle. Keep them in step.
 */
(() => {
  var KEY = "dreamfolio-theme";
  var LIGHT = "#f3eadc";
  var DARK = "#000000";

  var stored = null;
  try {
    stored = localStorage.getItem(KEY);
  } catch (e) {
    /* storage unavailable */
  }

  var prefersLight =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: light)").matches;
  var theme =
    stored === "light" || stored === "dark"
      ? stored
      : prefersLight
        ? "light"
        : "dark";

  document.documentElement.setAttribute("data-theme", theme);

  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", theme === "light" ? LIGHT : DARK);
  }
})();
