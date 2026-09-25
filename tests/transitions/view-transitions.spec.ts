import { test, expect, type Page } from "@playwright/test";

/**
 * Cross-document view transitions (phase 2, T1) — a CSS-only contract, no
 * script anywhere in this feature. Two things are worth a rendered test
 * rather than the unit-test CSS scanner `transition-contract.test.ts` already
 * uses for `transition`/`transition-duration`/`transition-delay`:
 *
 *  (a) the `@view-transition { navigation: auto; }` opt-in actually reaches
 *      the browser, inside the `prefers-reduced-motion: no-preference` guard
 *      it must live in — a unit test reading source text cannot tell whether
 *      Astro's build (which may inline, extract or hash the stylesheet)
 *      still ships the at-rule intact;
 *  (b) `view-transition-name` is a *computed style*, so "unique per
 *      document" and "reaches the right element" are runtime facts, not
 *      source facts — two selectors could each carry a name that is correct
 *      in isolation and still collide once Astro renders a page that
 *      contains both.
 *
 * Honest limit: Playwright does not expose whether a real cross-document
 * transition fired or what it looked like (the wipe, the shared-element
 * morph) — only the declared opt-in and the computed names it depends on.
 * The actual animation is a human/real-Chrome check, not this suite.
 */

const HOME = "/";
/** The three projects with a homepage card image and a detail cover image —
 * the only ones carrying a shared `view-transition-name` (see
 * portfolio.css's "Cross-document view transitions" section). `id` is
 * `projects.json`'s stable id, which the `.vt-art-*` classes and
 * `view-transition-name`s are built from; `slug` is the route
 * (`getProjectSlug` of the title) and only ever appears in a URL — the two
 * differ for drenyra (`id: "drenyra"`, slug
 * `drenyra-fiscal-command-center`), which is exactly the case this
 * distinction exists to keep straight. */
const SHARED_ART_PROJECTS = [
  { id: "drenyra", slug: "drenyra-fiscal-command-center" },
  { id: "dreamcoder-workbench", slug: "dreamcoder-workbench" },
  { id: "digital-public-peru", slug: "digital-public-peru" },
] as const;
/** A project with no cover image on either end — the negative case: it must
 * carry no view-transition-name, proving the gating in `[id].astro` is
 * scoped to `SHARED_ART_PROJECT_IDS` and not applied blindly. */
/** A project WITH a detail-page cover image but no homepage card: the only
 * kind of page where the `SHARED_ART_PROJECT_IDS` gate in `[id].astro`
 * actually decides something (a project without a cover never renders the
 * gated element at all, so it cannot prove the gate). */
const UNSHARED_PROJECT = { id: "edge-traz-agro", slug: "edgetraz-agro" };

/** Concatenates the raw text of every stylesheet reachable from the current
 * page — linked sheets by `fetch`ing their `href` (so this sees the exact
 * bytes the browser received, independent of whether its CSSOM parser
 * recognizes `@view-transition`), inline `<style>` sheets via `cssText`. */
async function siteCss(page: Page): Promise<string> {
  return page.evaluate(async () => {
    const sheets = Array.from(document.styleSheets);
    const chunks = await Promise.all(
      sheets.map(async (sheet) => {
        try {
          if (sheet.href) {
            const response = await fetch(sheet.href);
            return await response.text();
          }
          return Array.from(sheet.cssRules)
            .map((rule) => rule.cssText)
            .join("\n");
        } catch {
          return "";
        }
      }),
    );
    return chunks.join("\n");
  });
}

/** The computed `view-transition-name` of the first match of `selector`, or
 * `null` when the selector matches nothing. `"none"` (the CSS initial value)
 * is returned as-is rather than normalized, so a test that expects "no name"
 * can assert the literal computed value. */
async function viewTransitionName(
  page: Page,
  selector: string,
): Promise<string | null> {
  const locator = page.locator(selector).first();
  if ((await locator.count()) === 0) return null;
  return locator.evaluate(
    (el) =>
      (getComputedStyle(el) as unknown as Record<string, string>)[
        "viewTransitionName"
      ],
  );
}

test.describe("Cross-document view transitions — opt-in", () => {
  for (const path of [
    HOME,
    "/projects/drenyra-fiscal-command-center/",
    "/projects/dreamcoder-workbench/",
    "/projects/digital-public-peru/",
  ]) {
    test(
      `${path}: declares the @view-transition opt-in under prefers-reduced-motion: no-preference`,
      { tag: ["@critical", "@e2e", "@transitions", "@VT-OPT-IN"] },
      async ({ page }) => {
        await page.goto(path);
        const css = await siteCss(page);
        // Whitespace-tolerant: the production build minifies this to
        // `prefers-reduced-motion:no-preference)` (no space after the
        // colon), which a literal string match would miss.
        const guardMatch =
          /@media\s*\([^()]*prefers-reduced-motion\s*:\s*no-preference[^()]*\)\s*\{/.exec(
            css,
          );
        expect(
          guardMatch,
          `${path}: the reduced-motion guard itself is missing from the ` +
            "shipped CSS",
        ).not.toBeNull();
        const optInIndex = css.indexOf("@view-transition");
        expect(
          optInIndex,
          `${path}: @view-transition is missing`,
        ).toBeGreaterThan(-1);
        // Prove nesting, not just order: walk back from the opt-in to the
        // block that encloses it and check that block's own header is the
        // no-preference guard.
        let depth = 0;
        let openIndex = -1;
        for (let index = optInIndex - 1; index >= 0; index -= 1) {
          if (css[index] === "}") depth += 1;
          else if (css[index] === "{") {
            if (depth === 0) {
              openIndex = index;
              break;
            }
            depth -= 1;
          }
        }
        const headerStart = Math.max(
          css.lastIndexOf("}", openIndex),
          css.lastIndexOf(";", openIndex),
        );
        const enclosingHeader = css.slice(headerStart + 1, openIndex + 1);
        expect(
          enclosingHeader,
          `${path}: @view-transition must be nested directly inside the ` +
            "no-preference guard, not floating unguarded elsewhere",
        ).toMatch(
          /^\s*@media\s*\([^()]*prefers-reduced-motion\s*:\s*no-preference[^()]*\)\s*\{$/,
        );
        expect(css.slice(optInIndex, optInIndex + 60)).toMatch(
          /navigation\s*:\s*auto/,
        );
      },
    );
  }
});

test.describe("Cross-document view transitions — shared-element names", () => {
  test(
    "the fixed header carries the same view-transition-name on every route",
    { tag: ["@critical", "@e2e", "@transitions", "@VT-HEADER"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      for (const path of [
        HOME,
        "/projects/",
        "/projects/digital-public-peru/",
      ]) {
        await page.goto(path);
        await expect
          .poll(() => viewTransitionName(page, ".site-header"))
          .toBe("site-header");
      }
    },
  );

  for (const { id, slug } of SHARED_ART_PROJECTS) {
    test(
      `${id}: homepage card art and detail cover carry matching names`,
      { tag: ["@critical", "@e2e", "@transitions", `@VT-SHARED-${id}`] },
      async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "no-preference" });

        await page.goto(HOME);
        const homeArtName = await viewTransitionName(page, `.vt-art-${id}`);
        expect(homeArtName, `${id}: homepage card art`).toBe(
          `project-art-${id}`,
        );

        await page.goto(`/projects/${slug}/`);
        const detailArtName = await viewTransitionName(page, `.vt-art-${id}`);
        expect(detailArtName, `${id}: detail cover image`).toBe(homeArtName);
      },
    );
  }

  test(
    "a project with a cover but no homepage card gets no shared art name",
    { tag: ["@critical", "@e2e", "@transitions", "@VT-UNSHARED"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto(`/projects/${UNSHARED_PROJECT.slug}/`);
      const cover = page.locator("main img").first();
      await expect(
        cover,
        `${UNSHARED_PROJECT.id} must render a cover, or this test cannot ` +
          "exercise the SHARED_ART_PROJECT_IDS gate at all",
      ).toBeVisible();
      // The class is what the gate controls; the CSS only names the three
      // shared-art ids, so the computed name alone would stay `none` even
      // with the gate removed. Assert both.
      await expect(cover).not.toHaveClass(/\bvt-art-/);
      const named = await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .map((el) => getComputedStyle(el).viewTransitionName)
          .filter((name) => name !== "none" && name !== "site-header"),
      );
      expect(
        named,
        `${UNSHARED_PROJECT.id} has no homepage counterpart, so nothing on ` +
          "its page may carry a shared view-transition-name",
      ).toEqual([]);
    },
  );

  /** Regression guard: the title morph was removed on purpose (see
   * portfolio.css's "Shared project art" comment) because every shared-art
   * project pairs a short homepage card title (e.g. "Drenyra") with a
   * longer, different detail `<h1>` (e.g. "Drenyra — Fiscal Command
   * Center") — a group `view-transition-name` morphs the old text box into
   * the new one, so two different strings stretch/scale and leave a ghost
   * of the old text showing through mid-transition. This asserts no
   * `project-title-*` name is ever produced again, on either end. */
  test(
    "no project-title-* view-transition-name exists on the homepage or any detail page",
    { tag: ["@critical", "@e2e", "@transitions", "@VT-NO-TITLE-MORPH"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });

      const collectNames = () =>
        page.evaluate(() =>
          Array.from(document.querySelectorAll<HTMLElement>("*"))
            .map(
              (el) =>
                (getComputedStyle(el) as unknown as Record<string, string>)[
                  "viewTransitionName"
                ],
            )
            .filter((name) => name !== "none"),
        );

      await page.goto(HOME);
      const homeNames = await collectNames();
      expect(
        homeNames.some((name) => name.startsWith("project-title-")),
        `homepage must carry no project-title-* name, found [${homeNames.join(", ")}] — ` +
          "reintroducing the shared title morph re-stretches two different " +
          "strings (card title vs. detail h1) into each other",
      ).toBe(false);

      for (const { slug } of SHARED_ART_PROJECTS) {
        await page.goto(`/projects/${slug}/`);
        const detailNames = await collectNames();
        expect(
          detailNames.some((name) => name.startsWith("project-title-")),
          `/projects/${slug}/ must carry no project-title-* name, found [${detailNames.join(", ")}]`,
        ).toBe(false);
      }
    },
  );

  test(
    "every view-transition-name on the homepage is unique",
    { tag: ["@critical", "@e2e", "@transitions", "@VT-UNIQUE-HOME"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto(HOME);
      const names = await page.evaluate(() =>
        Array.from(document.querySelectorAll<HTMLElement>("*"))
          .map(
            (el) =>
              (getComputedStyle(el) as unknown as Record<string, string>)[
                "viewTransitionName"
              ],
          )
          .filter((name) => name !== "none"),
      );
      // The header plus the three shared-art projects' art: 4.
      expect(names.length).toBeGreaterThanOrEqual(4);
      expect(
        new Set(names).size,
        `duplicate names in [${names.join(", ")}]`,
      ).toBe(names.length);
    },
  );
});
