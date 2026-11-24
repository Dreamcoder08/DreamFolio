import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQuickProjects } from "../../src/lib/project-quick-modal.ts";

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
