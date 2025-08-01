import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";

const contentSourceDir = join(process.cwd(), "..", "..", "content");

export type ContentComponent = {
  slug: string;
  name: string;
  description?: string;
  defaultSize?: "desktop" | "mobile";
  coverUrl?: string;
  coverType?: "image" | "video";
  category?: "marketing" | "application" | "mobile";
  tags?: string[];
  authors?: { name: string; url: string; avatarUrl: string }[];
  asSeenOn?: { name: string; url: string; avatarUrl: string }[];
  // Below are all props for the Sandpack component
  sourceCode: string;
  previewCode: string;
  dependencies: Record<string, string>;
  previousSlug?: string;
  nextSlug?: string;
};

export const getContentComponents = cache(
  async (): Promise<Record<"string", ContentComponent>> => {
    const slugs = (await readdir(contentSourceDir)).filter(
      (slug) => !slug.startsWith("."),
    );

    const contentComponents = await Promise.all(
      slugs.map(async (slug, index) => {
        const metadata = JSON.parse(
          await readFile(
            join(contentSourceDir, slug, "meta.json"),
            "utf-8",
          ).catch(() => ""),
        ) as ContentComponent;

        const packageJson = JSON.parse(
          await readFile(
            join(contentSourceDir, slug, "package.json"),
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

        return {
          ...metadata,
          slug,
          dependencies: packageJson.dependencies,
          sourceCode,
          previewCode,
          previousSlug: slugs[index - 1],
          nextSlug: slugs[index + 1],
        };
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

export const getContentCategories = cache(async (): Promise<string[]> => {
  const content = await getContentComponents();
  return [
    ...new Set(
      Object.values(content)
        .map((c) => c.tags ?? [])
        .flat(),
    ),
  ];
});
