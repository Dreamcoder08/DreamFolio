import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuickProjects } from "../../src/lib/project-quick-modal.ts";
import { repoQuickCard } from "../../src/lib/project-quick-repo.ts";

test("repoQuickCard maps a synced repo to a quick-view card with the home id convention", () => {
  const card = repoQuickCard(
    {
      owner: "Dreamcoder08",
      name: "SipGes",
      url: "https://github.com/Dreamcoder08/SipGes",
      description: "Territorial platform.",
      language: "TypeScript",
      stars: 0,
      pushedAt: "2026-11-22T00:00:00Z",
      cover: { src: "/images/repos/x.webp", width: 960, height: 540, alt: "" },
    },
    "/archify/x.html",
  );
  assert.equal(card.id, "repo-dreamcoder08-sipges");
  assert.equal(card.title, "SipGes");
  assert.equal(card.githubUrl, "https://github.com/Dreamcoder08/SipGes");
  assert.equal(card.href, "https://github.com/Dreamcoder08/SipGes");
  assert.equal(card.isExternal, true);
  assert.equal(card.archifyHref, "/archify/x.html");
  assert.equal(card.cover?.src, "/images/repos/x.webp");
  assert.deepEqual(card.stack, ["TypeScript", "Dreamcoder08"]);
});

test("parseQuickProjects indexes valid items by id and ignores malformed JSON safely", () => {
  const map = parseQuickProjects(
    JSON.stringify([
      {
        id: "repo-sipges",
        title: "sipges",
        summary: "Territorial platform",
        eyebrow: "Open Source",
        stack: ["TypeScript"],
        githubUrl: "https://github.com/Dreamcoder08/sipges",
        coverSrc: "/images/repos/dreamcoder08-sipges.webp",
      },
    ]),
  );
  assert.equal(map.size, 1);
  assert.equal(map.get("repo-sipges")?.title, "sipges");
  assert.equal(parseQuickProjects("{invalid json").size, 0);
  assert.equal(parseQuickProjects(null).size, 0);
});
