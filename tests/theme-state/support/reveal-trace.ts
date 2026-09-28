import type { Page } from "@playwright/test";

/**
 * Samples `opacity` and the translate component of `transform` across a reveal,
 * in one page round trip so no frame of the animation can be missed: the scroll
 * that triggers the `IntersectionObserver` happens inside the same loop.
 */
export async function traceReveal(
  page: Page,
  selector: string,
): Promise<{
  readonly opacity: readonly number[];
  readonly translateY: readonly number[];
}> {
  const trace = await page.evaluate(
    (target) =>
      new Promise<{
        opacity: number[];
        translateY: number[];
        completed: boolean;
      }>((resolve) => {
        const el = document.querySelector(target);
        if (el === null) {
          resolve({ opacity: [], translateY: [], completed: true });
          return;
        }
        const opacity: number[] = [];
        const translateY: number[] = [];
        const started = performance.now();
        const sample = (): void => {
          const style = getComputedStyle(el);
          opacity.push(Number.parseFloat(style.opacity));
          const matrix = style.transform.split(",");
          translateY.push(Number.parseFloat(matrix[matrix.length - 1]));
        };
        sample();
        // Scroll in fixed steps, one per frame, instead of `smooth`: T2's
        // `.scene-card` reveals are scroll-driven (`animation-timeline:
        // view()`), so their progress follows scroll position, not time. An
        // instant jump — or a smooth scroll that skips frames under load —
        // crosses the entry range in a single frame and looks exactly like a
        // cut even though the mechanism works. Stepping guarantees frames
        // inside the range whatever the machine's load. A plain
        // transition-driven reveal still gets its gradualness from
        // `--motion-reveal`; sampling continues for 700 ms after the last
        // step (longer than the 640 ms reveal) so it finishes too.
        const rect = el.getBoundingClientRect();
        const docTop = window.scrollY + rect.top;
        const targetY = Math.max(
          0,
          docTop + rect.height / 2 - window.innerHeight / 2,
        );
        // Jump (instantly) to just before the element starts entering, then
        // cross the entry range in small steps: a row's entry range is only a
        // few dozen pixels tall, so coarse steps would skip straight over it.
        const startY = Math.max(
          0,
          Math.min(targetY, docTop - window.innerHeight - 40),
        );
        window.scrollTo({ top: startY, behavior: "instant" });
        const STEP_PX = 8;
        const STEPS = Math.max(1, Math.ceil((targetY - startY) / STEP_PX));
        let stepIndex = 0;
        let doneAt = Number.POSITIVE_INFINITY;
        const step = (): void => {
          if (stepIndex < STEPS) {
            stepIndex += 1;
            // `instant`: the site sets `scroll-behavior: smooth`, which
            // would turn every step into a fresh smooth scroll that barely
            // moves before the next step restarts it.
            window.scrollTo({
              top: startY + ((targetY - startY) * stepIndex) / STEPS,
              behavior: "instant",
            });
            if (stepIndex === STEPS) doneAt = performance.now();
          }
          sample();
          const now = performance.now();
          const stillStepping = stepIndex < STEPS || now - doneAt < 700;
          if (stillStepping && now - started < 6_000)
            requestAnimationFrame(step);
          else
            resolve({
              opacity,
              translateY,
              // False when the wall-clock cap cut the trace short.
              completed: stepIndex >= STEPS && now - doneAt >= 700,
            });
        };
        requestAnimationFrame(step);
      }),
    selector,
  );
  // A trace cut off by the cap would look exactly like a real cut; fail
  // loudly instead of letting the caller mistake it for evidence.
  if (!trace.completed) {
    throw new Error(
      `traceReveal(${selector}): hit the 6 s cap before crossing the entry ` +
        "range and settling — the runner is too loaded to trace the reveal",
    );
  }
  return { opacity: trace.opacity, translateY: trace.translateY };
}
