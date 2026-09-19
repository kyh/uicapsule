import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import type { TestContext } from "node:test";

import { validateContentDirectory } from "./content-validation";

const validMeta = { addedAt: "2026-01-01", name: "Example", tags: ["effects"] };

const fixture = async (context: TestContext, files: [string, string][]) => {
  const directory = await mkdtemp(path.join(tmpdir(), "uicapsule-registry-"));
  context.after(() => rm(directory, { force: true, recursive: true }));
  const defaults: [string, string][] = [
    ["meta.json", JSON.stringify(validMeta)],
    ["package.json", JSON.stringify({ dependencies: { react: "catalog:" } })],
    ["preview.tsx", "export default function Preview() { return null; }"],
  ];
  for (const [relativePath, source] of [...defaults, ...files]) {
    const target = path.join(directory, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, source);
  }
  return directory;
};

test("accepts portable imports without confusing comments or examples for dependencies", async (context) => {
  const directory = await fixture(context, [
    [
      "example.tsx",
      `import type { ReactNode } from "react";
       import "./style.css";
       // import { cn } from "@repo/ui";
       const example = 'import { cn } from "@repo/ui"';
       export const Example = ({ children }: { children: ReactNode }) => <div>{children}</div>;`,
    ],
    ["style.css", "/* @import '@repo/ui'; */\n.example { color: red; }"],
  ]);
  assert.deepEqual(await validateContentDirectory(directory), []);
});

test("rejects private imports, reexports, dynamic imports, require, and relative escapes", async (context) => {
  const directory = await fixture(context, [
    [
      "example.tsx",
      `import { Button } from "@repo/ui/components/button";
       export { cn } from "@repo/ui/lib/utils";
       export * from "../../packages/ui/src/lib/utils";
       const dynamic = import("@repo/api");
       const cjs = require("@repo/db");
       const alias = import("@/lib/content-data");`,
    ],
    ["style.css", '@import "@repo/ui/globals.css";'],
  ]);
  const issues = await validateContentDirectory(directory);
  assert.equal(issues.length, 7);
  for (const dependency of ["button", "utils", "@repo/api", "@repo/db", "@/lib", "globals.css"]) {
    assert.ok(
      issues.some((issue) => issue.includes(dependency)),
      dependency,
    );
  }
  assert.ok(issues.some((issue) => issue.includes("import escapes component directory")));
});

test("rejects workspace-only dependencies in every dependency group", async (context) => {
  const directory = await fixture(context, [
    [
      "package.json",
      JSON.stringify({
        dependencies: { "@repo/ui": "1.0.0", shared: "workspace:*" },
        devDependencies: { tools: "file:../../tools" },
        peerDependencies: { shared: "link:../shared" },
      }),
    ],
  ]);
  const issues = await validateContentDirectory(directory);
  assert.equal(issues.length, 4);
});

test("requires valid metadata and a real preview before publishing local content", async (context) => {
  const directory = await fixture(context, [["meta.json", JSON.stringify({ name: 42 })]]);
  const issues = await validateContentDirectory(directory);
  assert.ok(issues.some((issue) => issue.startsWith("name:")));
  await writeFile(
    path.join(directory, "meta.json"),
    JSON.stringify({ ...validMeta, tags: ["effects", "controls"] }),
  );
  const tagIssues = await validateContentDirectory(directory);
  assert.ok(tagIssues.some((issue) => issue.startsWith("tags:")));
  await writeFile(
    path.join(directory, "meta.json"),
    JSON.stringify({ ...validMeta, cover: "https://cdn.example.com/x/x.mp4" }),
  );
  const coverIssues = await validateContentDirectory(directory);
  assert.ok(coverIssues.some((issue) => issue.startsWith("cover:")));
  await writeFile(path.join(directory, "meta.json"), JSON.stringify(validMeta));
  await rm(path.join(directory, "preview.tsx"));
  assert.deepEqual(await validateContentDirectory(directory), ["missing preview.tsx"]);
});
