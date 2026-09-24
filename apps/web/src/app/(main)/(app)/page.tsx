import { canonicalAlternates, pageOpenGraph, pageTwitter } from "@/lib/agent/page-metadata";
import { getGalleryCards } from "@/lib/content-data";
import { Gallery } from "./_components/gallery";
import { GalleryOutline, GalleryStructuredData } from "./_components/gallery-outline";

import type { Metadata } from "next";

// Filtered views are the same gallery; point them all at the root.
export const metadata: Metadata = {
  alternates: canonicalAlternates("/"),
  openGraph: pageOpenGraph("/"),
  twitter: pageTwitter(),
};

// The outline and the JSON-LD are deliberately outside any <Suspense>: both read
// only `use cache` data, so they prerender into the static shell rather than
// streaming in behind the grid.
const Page = async () => (
  <>
    <GalleryStructuredData />
    <GalleryOutline />
    <Gallery cards={await getGalleryCards()} />
  </>
);

export default Page;
