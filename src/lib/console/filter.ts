import type { CommandDefinition } from "./types.ts";

/** A [start, end) slice of the *label* to highlight. Only ever produced when
 *  the label itself matched — a keyword-only match has no position in the
 *  label to highlight, so it comes back with an empty range list. */
export interface MatchRange {
  start: number;
  end: number;
}

export interface FilteredCommand {
  command: CommandDefinition;
  ranges: MatchRange[];
}

/** Lowercases and strips diacritics. NFD decomposition turns each accented
 *  character into a base character plus a combining mark; stripping the
 *  combining marks (Unicode general category Mn — "Mark, nonspacing", via a
 *  \p{} property escape rather than a hardcoded codepoint range, so it isn't
 *  limited to Latin accents) leaves a string the same length as the
 *  original label (one base character in, one base character out), which is
 *  what keeps the match ranges this module returns valid indices into the
 *  *original* label. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase();
}

interface HaystackMatch {
  score: number;
  ranges: MatchRange[];
}

function isWordStart(haystack: string, index: number): boolean {
  if (index === 0) return true;
  const before = haystack[index - 1];
  return !/[a-z0-9]/i.test(before);
}

/** Scores one normalized haystack against one normalized query. Exact and
 *  prefix matches rank highest, a match at a word boundary ranks next, and
 *  any other substring match ranks lowest. Returns null when the query
 *  isn't a substring of the haystack at all. */
function matchHaystack(haystack: string, query: string): HaystackMatch | null {
  const index = haystack.indexOf(query);
  if (index === -1) return null;

  const range: MatchRange = { start: index, end: index + query.length };
  if (haystack === query) return { score: 100, ranges: [range] };
  if (index === 0) return { score: 90, ranges: [range] };
  if (isWordStart(haystack, index)) return { score: 70, ranges: [range] };
  return { score: 50, ranges: [range] };
}

/** Filters and ranks commands against a query. Case- and accent-insensitive.
 *  An empty (or whitespace-only) query returns every command in its
 *  original, already-grouped order — the console's grouped default view. A
 *  query that matches nothing returns an empty array. Ties keep the
 *  original registry order (a stable sort). */
export function filterCommands(
  commands: CommandDefinition[],
  query: string,
): FilteredCommand[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return commands.map((command) => ({ command, ranges: [] }));
  }

  const normalizedQuery = normalize(trimmed);
  const scored: { entry: FilteredCommand; score: number; index: number }[] = [];

  commands.forEach((command, index) => {
    const labelMatch = matchHaystack(normalize(command.label), normalizedQuery);
    if (labelMatch) {
      scored.push({
        entry: { command, ranges: labelMatch.ranges },
        score: labelMatch.score,
        index,
      });
      return;
    }

    let bestKeywordScore = -1;
    for (const keyword of command.keywords) {
      const keywordMatch = matchHaystack(normalize(keyword), normalizedQuery);
      if (keywordMatch && keywordMatch.score > bestKeywordScore) {
        bestKeywordScore = keywordMatch.score;
      }
    }
    if (bestKeywordScore >= 0) {
      // Keyword matches rank below every label match, but keep their own
      // relative order (prefix keyword above plain-substring keyword).
      scored.push({
        entry: { command, ranges: [] },
        score: bestKeywordScore - 100,
        index,
      });
    }
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.map((s) => s.entry);
}
