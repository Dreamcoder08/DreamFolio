// Pure file-size budget logic. No fs access here on purpose: the CLI reads
// the tree and passes plain data in, so this module is trivial to unit test
// and never drifts from what the CLI actually measured.

/**
 * @typedef {{ path: string, lines: number }} FileInfo
 * @typedef {{ prefix: string, ext: string[] }} RuleMatch
 * @typedef {{ match: RuleMatch, max: number }} Rule
 * @typedef {{ path: string, ceiling: number }} AllowlistEntry
 * @typedef {{ rules: Rule[], allowlist: AllowlistEntry[] }} BudgetConfig
 */

/**
 * The first rule whose prefix and extension both match wins. A file with no
 * matching rule is unbudgeted and ignored entirely (lockfiles, public/, ...).
 * @param {string} path
 * @param {Rule[]} rules
 * @returns {Rule | undefined}
 */
export function findRule(path, rules) {
  const dot = path.lastIndexOf(".");
  const ext = dot === -1 ? "" : path.slice(dot);
  return rules.find(
    (rule) =>
      path.startsWith(rule.match.prefix) && rule.match.ext.includes(ext),
  );
}

/**
 * Line count matching `wc -l` semantics: a trailing newline does not count
 * as an extra empty line, an empty file is 0, and a file with content but no
 * trailing newline still counts its last (partial) line.
 * @param {string} text
 * @returns {number}
 */
export function countLines(text) {
  if (text.length === 0) return 0;
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

/**
 * @param {FileInfo[]} files
 * @param {BudgetConfig} config
 * @returns {{
 *   violations: { path: string, lines: number, max: number, ceiling?: number }[],
 *   staleAllowlist: { path: string, reason: string }[],
 * }}
 */
export function checkBudget(files, config) {
  const { rules, allowlist } = config;
  const byPath = new Map(files.map((file) => [file.path, file]));
  const allowByPath = new Map(allowlist.map((entry) => [entry.path, entry]));

  const violations = [];
  for (const file of files) {
    const rule = findRule(file.path, rules);
    if (!rule) continue; // unbudgeted, ignored

    const allowed = allowByPath.get(file.path);
    if (file.lines <= rule.max) continue;
    if (allowed && allowed.ceiling >= file.lines) continue;

    violations.push({
      path: file.path,
      lines: file.lines,
      max: rule.max,
      ...(allowed ? { ceiling: allowed.ceiling } : {}),
    });
  }

  const staleAllowlist = [];
  for (const entry of allowlist) {
    const rule = findRule(entry.path, rules);
    if (!rule) {
      staleAllowlist.push({
        path: entry.path,
        reason: "matches no budget rule — check the path/extension",
      });
      continue;
    }
    const file = byPath.get(entry.path);
    if (!file) {
      staleAllowlist.push({
        path: entry.path,
        reason: "file no longer exists",
      });
      continue;
    }
    if (file.lines <= rule.max) {
      staleAllowlist.push({
        path: entry.path,
        reason: "file is now within its rule budget",
      });
      continue;
    }
    if (entry.ceiling > file.lines) {
      staleAllowlist.push({
        path: entry.path,
        reason: `ceiling (${entry.ceiling}) is above the current line count (${file.lines}); lower it`,
      });
    }
  }

  return { violations, staleAllowlist };
}

/**
 * The ratchet: returns the allowlist the config *should* hold, given the
 * current tree. Each surviving entry's ceiling is lowered to the current
 * line count (via Math.min, so it can never rise even if the file grew).
 * An entry is dropped when its file is missing, matches no rule, or now
 * fits its rule's own max unaided. Never adds a new entry — a genuinely
 * new offender is a config edit a human makes on purpose.
 * @param {FileInfo[]} files
 * @param {BudgetConfig} config
 * @returns {AllowlistEntry[]}
 */
export function updateAllowlist(files, config) {
  const { rules, allowlist } = config;
  const byPath = new Map(files.map((file) => [file.path, file]));

  const next = [];
  for (const entry of allowlist) {
    const rule = findRule(entry.path, rules);
    if (!rule) continue;
    const file = byPath.get(entry.path);
    if (!file) continue;
    if (file.lines <= rule.max) continue;
    next.push({ ...entry, ceiling: Math.min(entry.ceiling, file.lines) });
  }
  return next;
}
