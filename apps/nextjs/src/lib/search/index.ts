import searchIndexData from "./index-data.json";

import type {
  SearchGroupKey,
  SearchIndex,
  SearchSectionItem,
  SearchTaxonomyItem,
  SearchTrendingItem,
} from "./types";

export const searchIndex = searchIndexData as SearchIndex;

export type {
  SearchGroupKey,
  SearchIndex,
  SearchSectionItem,
  SearchTaxonomyItem,
  SearchTrendingItem,
};
