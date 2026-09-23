import type { Metadata } from "next";

import { getGalleryCards } from "@/lib/content-data";
import { Gallery } from "./_components/gallery";

// Filtered views are the same gallery; point them all at the root.
export const metadata: Metadata = { alternates: { canonical: "/" } };

const Page = async () => <Gallery cards={await getGalleryCards()} />;

export default Page;
