export type SearchTrendingItem = {
  slug: string;
  name: string;
  description?: string;
  href: string;
  tags: string[];
};

export type SearchTaxonomyItem = {
  slug: string;
  name: string;
  href: string;
  count: number;
};

export type SearchSectionItem = SearchTaxonomyItem & {
  parent?: string;
};

export type SearchIndex = {
  trending: SearchTrendingItem[];
  categories: SearchTaxonomyItem[];
  sections: SearchSectionItem[];
  styles: SearchTaxonomyItem[];
};

export type SearchGroupKey = keyof SearchIndex;
