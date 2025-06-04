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
  sourceCode: string;
};

export const getContentComponents = cache(
  async (): Promise<Record<"string", ContentComponent>> => {
    const slugs = (await readdir(contentSourceDir)).filter(
      (slug) => !slug.startsWith("."),
    );

    const contentComponents = await Promise.all(
      slugs.map(async (slug) => {
        const metadata = JSON.parse(
          await readFile(join(contentSourceDir, slug, "meta.json"), "utf-8"),
        ) as ContentComponent;

        const sourceCode = await readFile(
          join(contentSourceDir, slug, "source.tsx"),
          "utf-8",
        );

        return { ...metadata, slug, sourceCode };
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

type PreviewComponent = {
  sourceCode: string;
  Component: React.ComponentType;
};

export const getPreviewComponent = cache(
  async (slug: string): Promise<PreviewComponent> => {
    const sourceCode = await readFile(
      join(process.cwd(), "src", "preview", `${slug}.tsx`),
      "utf-8",
    );

    const Component = (await import(`../preview/${slug}`).then(
      (module) => module.default,
    )) as React.ComponentType;

    return { sourceCode, Component };
  },
);
