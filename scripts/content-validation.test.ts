import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test, type TestContext } from "node:test";

import { validateContentDirectory } from "./content-validation";

const validMeta = { name: "Example", addedAt: "2026-01-01", tags: ["effects", "web"] };

const fixture = async (context: TestContext, files: [string, string][]) => {
  const directory = await mkdtemp(join(tmpdir(), "uicapsule-registry-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const defaults: [string, string][] = [
    ["meta.json", JSON.stringify(validMeta)],
    ["package.json", JSON.stringify({ dependencies: { react: "catalog:" } })],
    ["preview.tsx", "export default function Preview() { return null; }"],
  ];
  for (const [path, source] of [...defaults, ...files]) {
    const target = join(directory, path);
    await mkdir(dirname(target), { recursive: true });
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
        dependencies: { shared: "workspace:*", "@repo/ui": "1.0.0" },
        devDependencies: { tools: "file:../../tools" },
        peerDependencies: { shared: "link:../shared" },
      }),
    ],
  ]);
  assert.equal((await validateContentDirectory(directory)).length, 4);
});

test("requires valid metadata and a real preview before publishing local content", async (context) => {
  const directory = await fixture(context, [["meta.json", JSON.stringify({ name: 42 })]]);
  assert.ok((await validateContentDirectory(directory)).some((issue) => issue.startsWith("name:")));
  await writeFile(
    join(directory, "meta.json"),
    JSON.stringify({ ...validMeta, tags: ["effects", "controls", "web"] }),
  );
  assert.ok((await validateContentDirectory(directory)).some((issue) => issue.startsWith("tags:")));
  await writeFile(join(directory, "meta.json"), JSON.stringify(validMeta));
  await rm(join(directory, "preview.tsx"));
  assert.deepEqual(await validateContentDirectory(directory), ["missing preview.tsx"]);
});
