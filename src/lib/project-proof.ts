// Evidence rules for project detail pages. Pure and dependency-free so the
// build-time sync script (scripts/sync-project-proof.mjs) and the unit tests
// share exactly the same reading of a repository. Every item carries a URL:
// what a visitor cannot click and check is not presented as proof.

/** The subset of a GitHub REST `workflow run` object the proof reads. */
export interface RawWorkflowRun {
  name: string;
  status: string;
  conclusion: string | null;
  head_branch: string;
  html_url: string;
  created_at: string;
}

export interface CiProof {
  status: "passing" | "failing";
  workflow: string;
  url: string;
  date: string;
}

export interface DecisionProof {
  title: string;
  url: string;
}

export interface ProjectProof {
  repo: string;
  repoUrl: string;
  testFiles: number;
  ci: CiProof | null;
  decisions: DecisionProof[];
}

export interface ProofSnapshot {
  checkedAt: string;
  projects: Record<string, ProjectProof>;
}

const IGNORED_DIR = /(^|\/)(node_modules|vendor|fixtures|testdata|dist)\//;
const TEST_FILE = [
  /\.(test|spec)\.[cm]?[jt]sx?$/,
  /_test\.(go|py)$/,
  /(^|\/)test_[^/]+\.py$/,
  /\.bats$/,
  /(^|\/)(tests?|__tests__)\/.+\.(rs|go|py|sh|[cm]?[jt]sx?)$/,
];

/** Test files by naming convention. Inline Rust `#[test]` modules are not counted. */
export function isTestFile(path: string): boolean {
  if (IGNORED_DIR.test(path)) return false;
  return TEST_FILE.some((pattern) => pattern.test(path));
}

/** Markdown records inside an `adr/` or `decisions/` directory, index excluded. */
export function isDecisionRecord(path: string): boolean {
  return (
    /(^|\/)(adr|decisions)\/[^/]+\.md$/i.test(path) &&
    !/\/readme\.md$/i.test(path)
  );
}

export function decisionTitle(path: string): string {
  const name = (path.split("/").pop() ?? path).replace(/\.md$/i, "");
  const match = /^(?:adr-)?(\d+)-(.+)$/i.exec(name);
  const words = (match ? match[2] : name).replace(/[-_]+/g, " ").trim();
  const sentence = words.charAt(0).toUpperCase() + words.slice(1);
  return match ? `ADR ${match[1]} — ${sentence}` : sentence;
}

const SETTLED = new Set(["success", "failure", "timed_out", "action_required"]);

/**
 * Latest settled run on the default branch, preferring a workflow named "CI".
 * Cancelled and skipped runs say nothing about the code, so they are ignored.
 */
export function latestCi(
  runs: readonly RawWorkflowRun[],
  branch: string,
): CiProof | null {
  const settled = runs
    .filter(
      (run) =>
        run.head_branch === branch &&
        run.status === "completed" &&
        SETTLED.has(run.conclusion ?? ""),
    )
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const pick =
    settled.find((run) => run.name.toLowerCase() === "ci") ?? settled[0];
  if (!pick) return null;
  return {
    status: pick.conclusion === "success" ? "passing" : "failing",
    workflow: pick.name,
    url: pick.html_url,
    date: pick.created_at.slice(0, 10),
  };
}

export function buildProof(input: {
  repo: string;
  branch: string;
  tree: readonly string[];
  runs: readonly RawWorkflowRun[];
}): ProjectProof {
  const repoUrl = `https://github.com/${input.repo}`;
  return {
    repo: input.repo,
    repoUrl,
    testFiles: input.tree.filter(isTestFile).length,
    ci: latestCi(input.runs, input.branch),
    decisions: input.tree
      .filter(isDecisionRecord)
      .sort()
      .map((path) => ({
        title: decisionTitle(path),
        url: `${repoUrl}/blob/${input.branch}/${path}`,
      })),
  };
}
