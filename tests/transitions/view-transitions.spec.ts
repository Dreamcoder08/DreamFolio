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
 * `projects.json`'s stable id, which the `.vt-art-*`/`.vt-title-*` classes
 * and `view-transition-name`s are built from; `slug` is the route
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
const UNSHARED_PROJECT = "elect-validate";

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
        const guardIndex = guardMatch!.index;
        const optInIndex = css.indexOf("@view-transition", guardIndex);
        expect(
          optInIndex,
          `${path}: @view-transition must appear after (nested inside) the ` +
            "no-preference guard, not floating unguarded elsewhere",
        ).toBeGreaterThan(guardIndex);
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
      `${id}: homepage card art/title and detail cover/heading carry matching names`,
      { tag: ["@critical", "@e2e", "@transitions", `@VT-SHARED-${id}`] },
      async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "no-preference" });

        await page.goto(HOME);
        const homeArtName = await viewTransitionName(page, `.vt-art-${id}`);
        const homeTitleName = await viewTransitionName(page, `.vt-title-${id}`);
        expect(homeArtName, `${id}: homepage card art`).toBe(
          `project-art-${id}`,
        );
        expect(homeTitleName, `${id}: homepage card title`).toBe(
          `project-title-${id}`,
        );

        await page.goto(`/projects/${slug}/`);
        const detailArtName = await viewTransitionName(page, `.vt-art-${id}`);
        const detailTitleName = await viewTransitionName(
          page,
          `.vt-title-${id}`,
        );
        expect(detailArtName, `${id}: detail cover image`).toBe(homeArtName);
        expect(detailTitleName, `${id}: detail heading`).toBe(homeTitleName);
      },
    );
  }

  test(
    "a project with no shared art carries no view-transition-name on its detail page",
    { tag: ["@critical", "@e2e", "@transitions", "@VT-UNSHARED"] },
    async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto(`/projects/${UNSHARED_PROJECT}/`);
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeVisible();
      const name = await heading.evaluate(
        (el) =>
          (getComputedStyle(el) as unknown as Record<string, string>)[
            "viewTransitionName"
          ],
      );
      expect(
        name,
        `${UNSHARED_PROJECT} has no homepage counterpart art, so its ` +
          "heading must not be given a shared view-transition-name",
      ).toBe("none");
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
      // The header plus the three shared-art projects' art and title: 7.
      expect(names.length).toBeGreaterThanOrEqual(7);
      expect(
        new Set(names).size,
        `duplicate names in [${names.join(", ")}]`,
      ).toBe(names.length);
    },
  );
});
