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

/**
 * Origin of an absolute URL, or [] for a same-origin path.
 *
 * A value that is neither is a configuration mistake, and failing is the point:
 * returning nothing would drop the origin from the policy and the tracker would
 * be blocked in the browser with no other symptom to notice.
 */
function originOf(source: string): string[] {
  // A same-origin path needs no extra source: `'self'` already covers it.
  if (source.startsWith("/")) {
    return [];
  }

  let parsed: URL | null = null;
  try {
    parsed = new URL(source);
  } catch {
    parsed = null;
  }

  // A misspelled scheme still parses as some other protocol, so checking the
  // protocol too catches `htp://…`, which would otherwise put a bogus origin in
  // the policy and block the tracker with no symptom other than silence.
  if (
    !parsed ||
    (parsed.protocol !== "https:" && parsed.protocol !== "http:")
  ) {
    throw new Error(
      `Analytics configuration is invalid: "${source}" is neither a same-origin path nor an absolute http(s) URL. ` +
        `Set it to a valid URL such as https://analytics.example.com, or leave the variable unset.`,
    );
  }

  return [parsed.origin];
}

export function resolveAnalytics(env: Env): AnalyticsConfig {
  const src = env.PUBLIC_UMAMI_SRC ?? CLOUD.src;
  const websiteId = env.PUBLIC_UMAMI_WEBSITE_ID ?? CLOUD.websiteId;

  if (!src || !websiteId) {
    return DISABLED;
  }

  const scriptOrigins = originOf(src);

  // connect-src defaults to the script's own origin, which is where a
  // self-hosted tracker posts its beacon. The hosted instance is the exception:
  // it sends to a separate collection host. An explicit value overrides both,
  // and an explicitly empty one says the tracker posts to the page's own
  // origin, so `'self'` already covers it.
  const connectOverride = env.PUBLIC_UMAMI_CONNECT;
  let connectOrigins: string[];
  if (connectOverride === undefined) {
    connectOrigins = src === CLOUD.src ? CLOUD.connectOrigins : scriptOrigins;
  } else if (connectOverride === "") {
    connectOrigins = [];
  } else {
    connectOrigins = originOf(connectOverride);
  }

  return { enabled: true, src, websiteId, scriptOrigins, connectOrigins };
}
