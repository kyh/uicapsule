import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { z } from "zod";

const readJson = async <T extends z.ZodType>(file: string, schema: T) =>
  schema.parse(JSON.parse(await readFile(file, "utf-8")));

test("every skill skills-lock.json installs stays out of oxfmt, so it matches its locked hash", async () => {
  const lock = await readJson(
    "skills-lock.json",
    z.object({ skills: z.record(z.string(), z.object({ installMode: z.string() })) }),
  );

  const oxfmt = await readJson(".oxfmtrc.json", z.object({ ignorePatterns: z.array(z.string()) }));
  const ignored = new Set(oxfmt.ignorePatterns);

  for (const [name, entry] of Object.entries(lock.skills)) {
    assert.ok(
      ignored.has(`.claude/skills/${name}`),
      `.oxfmtrc.json must ignore .claude/skills/${name}`,
    );
    assert.equal(entry.installMode, "copy", `${name} must be installed with --copy`);
  }
});
