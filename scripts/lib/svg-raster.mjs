// Rasterizes an SVG the way a browser shows it. sharp's own SVG renderer
// (librsvg) ignores CSS custom properties and embedded fonts, so a styled
// banner comes out as a blank rectangle; Chromium, already installed for the
// e2e suite, renders it faithfully.
//
// The SVG is loaded as an <img>, which browsers run in secure static mode:
// no scripts, no external requests. JavaScript is disabled on the page too.
const WIDTH = 1280;
// A promise, not a browser: covers resolve concurrently and must share one.
let launching;

/** PNG bytes of `svg` at 1280px wide, or null when Chromium is unavailable. */
export async function rasterizeSvg(svg) {
  try {
    launching ??= import("@playwright/test").then(({ chromium }) =>
      chromium.launch(),
    );
    const page = await (
      await launching
    ).newPage({
      viewport: { width: WIDTH, height: 800 },
      javaScriptEnabled: false,
    });
    try {
      const source = `data:image/svg+xml;base64,${svg.toString("base64")}`;
      await page.setContent(
        `<body style="margin:0"><img src="${source}" style="display:block;width:${WIDTH}px;height:auto">`,
      );
      return await page
        .locator("img")
        .screenshot({ type: "png", omitBackground: true });
    } finally {
      await page.close();
    }
  } catch (error) {
    console.warn(`::warning::repo covers: SVG render failed: ${error.message}`);
    return null;
  }
}

export async function closeRasterizer() {
  const browser = await launching?.catch(() => null);
  launching = undefined;
  await browser?.close();
}
