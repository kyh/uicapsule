import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { describe, test } from "node:test";

import { SKILLS, skillCatalog, skillUri } from "./mcp-skills";

const sha256 = (text: string) => `sha256:${createHash("sha256").update(text).digest("hex")}`;

describe("mcp skills", () => {
  test("lists each skill by its SKILL.md, with every file's digest and size", async () => {
    const catalog = await skillCatalog();

    assert.deepEqual(
      catalog.map(({ uri }) => uri),
      SKILLS.map((skill) => skillUri(skill)),
    );

    for (const skill of SKILLS) {
      const entry = catalog.find(({ uri }) => uri === skillUri(skill));

      assert.deepEqual(entry?.frontmatter, { description: skill.description, name: skill.name });
      assert.deepEqual(
        entry?.resources,
        skill.files.map((file) => ({
          digest: sha256(file.text),
          size: Buffer.byteLength(file.text),
          uri: skillUri(skill, file.path),
        })),
      );
    }
  });

  test("opens SKILL.md with the frontmatter it lists", () => {
    for (const skill of SKILLS) {
      const [main] = skill.files;

      assert.equal(main?.path, "SKILL.md");
      assert.ok(
        main.text.startsWith(
          `---\nname: ${skill.name}\ndescription: ${JSON.stringify(skill.description)}\n---\n`,
        ),
      );
    }
  });

  test("names only tools the server registers", () => {
    const named = new Set(
      SKILLS.flatMap((skill) =>
        skill.files.flatMap((file) => [...file.text.matchAll(/`(?<tool>\w+_\w+)`/gu)]),
      ).map((match) => match.groups?.tool),
    );

    assert.deepEqual([...named].toSorted(), ["get_component", "search_components"]);
  });
});
