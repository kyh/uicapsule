import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { writeScaffold } from "./content-scaffold";
import { validateContentDirectory } from "./content-validation";

test("a scaffolded design system is valid, scoped to its slug, and carries no template-only files", async (context) => {
  const root = await mkdtemp(path.join(tmpdir(), "uicapsule-scaffold-"));
  context.after(() => rm(root, { force: true, recursive: true }));
  const directory = path.join(root, "brass-instruments");
  await writeScaffold(directory, {
    description: "Machined brass, engraved scales.",
    kind: "design-system",
    name: "Brass Instruments",
    slug: "brass-instruments",
  });

  assert.deepEqual(await validateContentDirectory(directory), []);

  const files = await readdir(directory, { recursive: true });
  assert.ok(!files.includes("README.md"));

  const sources = await Promise.all(
    files
      .filter((file) => /\.(?:tsx?|css)$/u.test(file))
      .map((file) => readFile(path.join(directory, file), "utf-8")),
  );

  assert.ok(sources.every((source) => !source.includes("ds-template")));
  assert.match(
    await readFile(path.join(directory, "tokens.css"), "utf-8"),
    /\.ds-brass-instruments \{/u,
  );
  assert.match(await readFile(path.join(directory, "system.ts"), "utf-8"), /"Brass Instruments"/u);

  const meta = JSON.parse(await readFile(path.join(directory, "meta.json"), "utf-8"));
  assert.deepEqual(meta.tags, ["design-systems"]);
  assert.equal(meta.defaultSize, "full");
});
