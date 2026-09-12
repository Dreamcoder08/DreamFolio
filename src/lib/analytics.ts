/**
 * Single source of truth for analytics.
 *
 * Both the `<script>` tag and the Content-Security-Policy are derived from
 * `resolveAnalytics`, so pointing analytics at your own instance — or turning
 * it off — is one change in one place.
 *
 * This module exists because those two used to disagree. The script URL came
 * from an environment variable while the CSP origins were hardcoded in
 * astro.config.mjs, so self-hosting would have left the script blocked by a
 * policy that still only allowed the hosted origin. That failure is silent in
 * the browser, which is what makes it worth preventing structurally rather
 * than documenting.
 */

export interface AnalyticsConfig {
  enabled: boolean;
  /** Script URL. Empty when analytics is disabled. */
  src: string;
  /** Tracker identifier. Empty when analytics is disabled. */
  websiteId: string;
  /** Extra `script-src` sources. Empty means same-origin only. */
  scriptOrigins: string[];
  /** Extra `connect-src` sources for the collection endpoint. */
  connectOrigins: string[];
}

type Env = Record<string, string | undefined>;

const CLOUD = {
  src: "https://cloud.umami.is/script.js",
  // Not a secret: the hosted instance exposes this in the script tag of every
  // page it tracks.
  websiteId: "c2e89983-d7b4-4f2f-adb0-00495b95a5f7",
  /** The hosted tracker posts to a collection host separate from the script. */
  connectOrigins: ["https://gateway.umami.is"],
};

const DISABLED: AnalyticsConfig = {
  enabled: false,
  src: "",
  websiteId: "",
  scriptOrigins: [],
  connectOrigins: [],
};

/** Origin of an absolute URL, or [] when it is a same-origin path. */
function originOf(url: string): string[] {
  try {
    return [new URL(url).origin];
  } catch {
    return [];
  }
}

export function resolveAnalytics(env: Env): AnalyticsConfig {
  const src = env.PUBLIC_UMAMI_SRC ?? CLOUD.src;
  const websiteId = env.PUBLIC_UMAMI_WEBSITE_ID ?? CLOUD.websiteId;

  if (!src || !websiteId) {
    return DISABLED;
  }

  const scriptOrigins = originOf(src);
  const connectOverride = env.PUBLIC_UMAMI_CONNECT;

  // A self-hosted instance normally serves the collection endpoint from the
  // same origin as the script. An explicit override covers deployments that
  // split them, and a same-origin path needs no extra source at all.
  let connectOrigins: string[];
  if (connectOverride !== undefined) {
    connectOrigins = originOf(connectOverride);
  } else if (src === CLOUD.src) {
    connectOrigins = CLOUD.connectOrigins;
  } else {
    connectOrigins = scriptOrigins;
  }

  return { enabled: true, src, websiteId, scriptOrigins, connectOrigins };
}
