import { readFile } from "node:fs/promises";
import { join } from "node:path";

const contentSourceDir = join(
  process.cwd(),
  "..",
  "..",
  "packages",
  "content",
  "src",
);

export const getSourceCode = async (slug: string) => {
  const sourceCode = await readFile(
    join(join(contentSourceDir, slug), "source.tsx"),
    "utf-8",
  );

  return sourceCode;
};

export const getPreviewCode = async (slug: string) => {
  const previewCode = await readFile(
    join(join(contentSourceDir, slug), "preview.tsx"),
    "utf-8",
  );
  return previewCode;
};

type ComponentMeta = {
  title: string;
  description: string;
  tags: string[];
};

export const getComponentMeta = async (
  slug: string,
): Promise<ComponentMeta> => {
  const componentMeta = await readFile(
    join(join(contentSourceDir, slug), "meta.json"),
    "utf-8",
  );

  return JSON.parse(componentMeta) as ComponentMeta;
};
