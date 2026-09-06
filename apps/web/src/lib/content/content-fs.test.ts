import assert from "node:assert/strict";
import { chmod, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";

const fixture = await mkdtemp(join(tmpdir(), "uicapsule-content-"));
const contentRoot = join(fixture, "content");
const webRoot = join(fixture, "apps", "web");
const packageSource = JSON.stringify({
  dependencies: { react: "19", "react-dom": "19", "@repo/ui": "workspace:*", motion: "13" },
  devDependencies: { "@types/react": "19", "@types/react-dom": "19", typescript: "7", sass: "1" },
});
const sourceFiles = [
  { path: "/nested/a.ts", code: "export const value = 1;" },
  { path: "/nested/z.css", code: ".example { color: red; }" },
  { path: "/package.json", code: packageSource },
  { path: "/preview.tsx", code: "export default function Preview() { return null; }" },
  { path: "/README.md", code: "Example component" },
];
const fixtureFiles: [string, string][] = [
  ["local/meta.json", JSON.stringify({ name: "Local" })],
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
      name: "Remote",
      type: "remote",
      iframeUrl: "https://example.com/preview",
      sourceUrl: "https://example.com/source",
    }),
  ],
  ["broken-json/meta.json", "{"],
  ["bad-metadata/meta.json", JSON.stringify({ name: 42 })],
  ["bad-metadata/preview.tsx", "export default function Preview() {}"],
  ["missing-preview/meta.json", JSON.stringify({ name: "Missing preview" })],
  [".hidden/meta.json", JSON.stringify({ name: "Hidden" })],
  [".hidden/preview.tsx", "export default function Preview() {}"],
];
await mkdir(webRoot, { recursive: true });
for (const [path, source] of fixtureFiles) {
  const target = join(contentRoot, path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, source);
}

after(() => rm(fixture, { recursive: true, force: true }));

const previousCwd = process.cwd();
process.chdir(webRoot);
const { readContentIndex, readContentBySlug, readSourceFiles, buildShadcnRegistryItem } =
  await import("./content-fs");
process.chdir(previousCwd);

test("indexes loadable metadata without reading component source", async () => {
  const sourcePath = join(contentRoot, "local", "nested", "a.ts");
  // An eager source read fails for normal users; root can bypass filesystem permissions.
  await chmod(sourcePath, 0);
  try {
    assert.deepEqual(await readContentIndex(), [
      { slug: "local", name: "Local", type: "local" },
      {
        slug: "remote",
        name: "Remote",
        type: "remote",
        iframeUrl: "https://example.com/preview",
        sourceUrl: "https://example.com/source",
      },
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
  assert.deepEqual(registry.dependencies, ["motion"]);
  assert.deepEqual(registry.devDependencies, ["sass"]);
  assert.deepEqual(registry.registryDependencies, []);
  assert.deepEqual(
    registry.files.map((file) => file.path),
    sourceFiles.map((file) => file.path),
  );
  assert.deepEqual(
    registry.files.find((file) => file.path === "/nested/a.ts"),
    {
      type: "registry:file",
      path: "/nested/a.ts",
      content: "export const value = 1;",
      target: "uicapsule/local/nested/a.ts",
    },
  );
});

test("slug lookup cannot escape the content index", async () => {
  assert.equal(await readContentBySlug("../local"), null);
  assert.equal(await readContentBySlug("local/../../package.json"), null);
  assert.equal(await readContentBySlug("missing"), null);
});
