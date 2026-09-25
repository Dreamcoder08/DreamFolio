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
    const file = byPath.get(entry.path);
    if (!file) {
      staleAllowlist.push({
        path: entry.path,
        reason: "file no longer exists",
      });
      continue;
    }
    const rule = findRule(entry.path, rules);
    if (!rule || file.lines <= rule.max) {
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
