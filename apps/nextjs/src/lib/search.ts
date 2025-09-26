import { getContentComponents } from "@/lib/content";

export type SearchEntry = {
  slug: string;
  name: string;
  description: string;
  tags: string[];
};

export const getSearchEntries = async (): Promise<SearchEntry[]> => {
  const content = Object.values(await getContentComponents());

  return content.map((component) => ({
    slug: component.slug,
    name: component.name,
    description: component.description ?? "",
    tags: component.tags ?? [],
  }));
};
