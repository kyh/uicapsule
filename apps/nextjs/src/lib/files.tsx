import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";

const contentSourceDir = join(
  process.cwd(),
  "..",
  "..",
  "packages",
  "content",
  "src",
);

type ContentComponent = {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  // Below are all props for the Sandpack component
  sourceCode: string;
  previewCode: string;
  dependencies: Record<string, string>;
};

export const getContentComponents = cache(
  async (): Promise<Record<"string", ContentComponent>> => {
    const slugs = (await readdir(contentSourceDir)).filter(
      (slug) => !slug.startsWith("."),
    );

    const contentComponents = await Promise.all(
      slugs.map(async (slug) => {
        const metadata = JSON.parse(
          await readFile(
            join(contentSourceDir, slug, "meta.json"),
            "utf-8",
          ).catch(() => ""),
        ) as ContentComponent;

        const sourceCode = await readFile(
          join(contentSourceDir, slug, "source.tsx"),
          "utf-8",
        ).catch(() => "");

        const previewCode = await readFile(
          join(contentSourceDir, slug, "preview.tsx"),
          "utf-8",
        ).catch(() => "");

        return { ...metadata, slug, sourceCode, previewCode };
      }),
    );

    return contentComponents.reduce(
      (acc, component) => {
        acc[component.slug] = component;
        return acc;
      },
      {} as Record<string, ContentComponent>,
    );
  },
);

export const getContentComponent = cache(
  async (slug: string): Promise<ContentComponent> => {
    const content = await getContentComponents();
    return content[slug as keyof typeof content];
  },
);
