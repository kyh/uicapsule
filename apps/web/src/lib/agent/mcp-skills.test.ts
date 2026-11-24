import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, test } from "node:test";

import { readRepoSkill } from "../content/skills-fs";

import { COMPONENTS_SKILL, REPO_SKILLS, skillCatalog, skillUri } from "./mcp-skills";

const sha256 = (text: string) => `sha256:${createHash("sha256").update(text).digest("hex")}`;

const repoSkills = await Promise.all(REPO_SKILLS.map(readRepoSkill));
const skills = [COMPONENTS_SKILL, ...repoSkills];

describe("mcp skills", () => {
  test("lists each skill by its SKILL.md, with every file's digest and size", async () => {
    const catalog = await skillCatalog(skills);

    assert.deepEqual(
      catalog.map(({ uri }) => uri),
      skills.map((skill) => skillUri(skill)),
    );

    for (const skill of skills) {
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

  test("opens the components skill with the frontmatter it lists", () => {
    const [main] = COMPONENTS_SKILL.files;

    assert.equal(main?.path, "SKILL.md");
    assert.ok(
      main.text.startsWith(
        `---\nname: ${COMPONENTS_SKILL.name}\ndescription: ${JSON.stringify(COMPONENTS_SKILL.description)}\n---\n`,
      ),
    );
  });

  test("the components skill names only tools the server registers", () => {
    const named = new Set(
      COMPONENTS_SKILL.files
        .flatMap((file) => [...file.text.matchAll(/`(?<tool>\w+_\w+)`/gu)])
        .map((match) => match.groups?.tool),
    );

    assert.deepEqual([...named].toSorted(), ["get_component", "search_components"]);
  });

  test("serves each repo skill from .claude/skills with SKILL.md first and unique names", () => {
    assert.equal(new Set(skills.map((skill) => skill.name)).size, skills.length);

    for (const skill of repoSkills) {
      assert.equal(skill.files[0]?.path, "SKILL.md", skill.name);
    }
  });

  test("every sibling a served skill links to is served too", () => {
    const served = new Set(
      skills.flatMap((skill) => skill.files.map((file) => skillUri(skill, file.path))),
    );

    for (const skill of repoSkills) {
      for (const file of skill.files) {
        for (const match of file.text.matchAll(
          /\.\.\/(?<sibling>[a-z0-9-]+)\/(?<target>[\w./-]+\.md)/gu,
        )) {
          const uri = `skill://${match.groups?.sibling}/${match.groups?.target}`;
          assert.ok(served.has(uri), `${skill.name}/${file.path} links to unserved ${uri}`);
        }
      }
    }
  });

  test("THIRD_PARTY.md credits every served repo skill", async () => {
    const credits = await readFile(
      path.resolve(process.cwd(), "..", "..", ".claude", "skills", "THIRD_PARTY.md"),
      "utf-8",
    );

    for (const name of REPO_SKILLS) {
      assert.ok(credits.includes(`| \`${name}\``), `${name} is missing from THIRD_PARTY.md`);
    }
  });
});
