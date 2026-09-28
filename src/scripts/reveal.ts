// Drives the [data-reveal] scroll-in animation declared in portfolio.css.
// Bundled by Astro (imported from a plain, non-`is:inline` <script> tag in
// BaseLayout.astro), so it is a same-origin module `script-src 'self'`
// already allows and that needs no CSP hash. See src/layouts/BaseLayout.astro.
(function () {
  try {
    var reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    var targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return;
    var pending = new Set(targets);
    function reveal(el: Element) {
      el.classList.add("is-visible");
      pending.delete(el);
      io.unobserve(el);
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) reveal(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );
    targets.forEach(function (el) {
      io.observe(el);
    });
    document.documentElement.classList.add("motion-ready");

    // A scroll jump large enough to carry a target from fully below to
    // fully above the viewport in one frame never registers as
    // intersecting, so it stays observed but never revealed. Sweep on
    // scroll and reveal anything already reached or passed.
    var sweepQueued = false;
    function sweep() {
      sweepQueued = false;
      pending.forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight) reveal(el);
      });
      if (!pending.size) window.removeEventListener("scroll", queueSweep);
    }
    function queueSweep() {
      if (!sweepQueued) {
        sweepQueued = true;
        requestAnimationFrame(sweep);
      }
    }
    window.addEventListener("scroll", queueSweep, { passive: true });
  } catch (e) {}
})();
