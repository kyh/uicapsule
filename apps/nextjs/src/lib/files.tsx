import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const contentSourceDir = join(
  process.cwd(),
  "..",
  "..",
  "packages",
  "content",
  "src",
);

export const getComponentSourceCode = async (slug: string): Promise<string> => {
  const sourceCode = await readFile(
    join(contentSourceDir, slug, "source.tsx"),
    "utf-8",
  );

  return sourceCode;
};

type ComponentMetadata = {
  slug: string;
  name: string;
  description: string;
  tags: string[];
};

export const getComponentMetadata = async (
  slug: string,
): Promise<ComponentMetadata> => {
  const componentMetadata = await readFile(
    join(contentSourceDir, slug, "meta.json"),
    "utf-8",
  );

  return JSON.parse(componentMetadata) as ComponentMetadata;
};

export const listContentComponents = async (): Promise<ComponentMetadata[]> => {
  const files = await readdir(contentSourceDir);

  const contentComponents = await Promise.all(
    files.map(async (file) => {
      const metadata = await getComponentMetadata(file);
      return { ...metadata, slug: file };
    }),
  );

  return contentComponents;
};

export const getPreviewSourceCode = async (slug: string): Promise<string> => {
  const previewCode = await readFile(
    join(process.cwd(), "src", "preview", `${slug}.tsx`),
    "utf-8",
  );

  return previewCode;
};

export const getPreviewComponent = async (
  slug: string,
): Promise<React.ComponentType> => {
  const Component = (await import(`../preview/${slug}.tsx`).then(
    (module) => module.default,
  )) as React.ComponentType;

  return Component;
};
