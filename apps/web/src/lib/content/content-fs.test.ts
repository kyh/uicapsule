import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";

const fixture = await mkdtemp(path.join(tmpdir(), "uicapsule-content-"));
const contentRoot = path.join(fixture, "content");
const webRoot = path.join(fixture, "apps", "web");
const packageSource = JSON.stringify({
  dependencies: { motion: "13", react: "19", "react-dom": "19" },
  devDependencies: { "@types/react": "19", "@types/react-dom": "19", sass: "1", typescript: "7" },
  peerDependencies: { "date-fns": "4", motion: "13", react: "19" },
});
const sourceFiles = [
  { code: "export const value = 1;", path: "/nested/a.ts" },
  { code: ".example { color: red; }", path: "/nested/z.css" },
  { code: packageSource, path: "/package.json" },
  { code: "export default function Preview() { return null; }", path: "/preview.tsx" },
  { code: "Example component", path: "/README.md" },
];
const fixtureFiles: [string, string][] = [
  ["local/meta.json", JSON.stringify({ addedAt: "2026-01-01", name: "Local" })],
  ...sourceFiles.map((file): [string, string] => [`local${file.path}`, file.code]),
  ["local/node_modules/dep/index.ts", "ignored"],
  ["local/dist/index.js", "ignored"],
  ["local/.cache/source.ts", "ignored"],
  ["local/.turbo/source.ts", "ignored"],
  ["local/package-lock.json", "ignored"],
  ["local/pnpm-lock.yaml", "ignored"],
  ["local/cover.png", "ignored"],
  [
    "remote/meta.json",
    JSON.stringify({
      addedAt: "2026-01-02",
      iframeUrl: "https://example.com/preview",
      name: "Remote",
      sourceUrl: "https://example.com/source",
      type: "remote",
    }),
  ],
  ["broken-json/meta.json", "{"],
  ["bad-metadata/meta.json", JSON.stringify({ name: 42 })],
  ["bad-metadata/preview.tsx", "export default function Preview() {}"],
  ["missing-preview/meta.json", JSON.stringify({ addedAt: "2026-01-01", name: "Missing preview" })],
  [".hidden/meta.json", JSON.stringify({ addedAt: "2026-01-01", name: "Hidden" })],
  [".hidden/preview.tsx", "export default function Preview() {}"],
];
await mkdir(webRoot, { recursive: true });
for (const [relativePath, source] of fixtureFiles) {
  const target = path.join(contentRoot, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, source);
}

after(() => rm(fixture, { force: true, recursive: true }));

const previousCwd = process.cwd();
process.chdir(webRoot);
const { readContentIndex, readContentBySlug, readSourceFiles, buildShadcnRegistryItem } =
  await import("./content-fs");
process.chdir(previousCwd);

test("indexes loadable metadata without reading component source", async () => {
  const sourcePath = path.join(contentRoot, "local", "nested", "a.ts");
  // An eager source read fails for normal users; root can bypass filesystem permissions.
  await chmod(sourcePath, 0);
  try {
    assert.deepEqual(await readContentIndex(), [
      {
        addedAt: "2026-01-02",
        iframeUrl: "https://example.com/preview",
        name: "Remote",
        slug: "remote",
        sourceUrl: "https://example.com/source",
        type: "remote",
      },
      { addedAt: "2026-01-01", name: "Local", slug: "local", type: "local" },
    ]);
  } finally {
    await chmod(sourcePath, 0o600);
  }
});

test("source and registry downloads preserve consumer files and dependencies", async () => {
  const component = await readContentBySlug("local");
  assert.ok(component?.type === "local");
  assert.deepEqual(await readSourceFiles(component), sourceFiles);

  const registry = await buildShadcnRegistryItem(component);
  assert.equal(registry.type, "registry:block");
  assert.equal(registry.name, "local");
  assert.deepEqual(registry.dependencies, ["motion", "date-fns"]);
  assert.deepEqual(registry.devDependencies, ["sass"]);
  assert.deepEqual(registry.registryDependencies, []);
  assert.deepEqual(
    registry.files.map((file) => file.path),
    sourceFiles.map((file) => file.path),
  );
  assert.deepEqual(
    registry.files.find((file) => file.path === "/nested/a.ts"),
    {
      content: "export const value = 1;",
      path: "/nested/a.ts",
      target: "uicapsule/local/nested/a.ts",
      type: "registry:file",
    },
  );
});

test("slug lookup cannot escape the content index", async () => {
  assert.equal(await readContentBySlug("../local"), null);
  assert.equal(await readContentBySlug("local/../../package.json"), null);
  assert.equal(await readContentBySlug("missing"), null);
});
