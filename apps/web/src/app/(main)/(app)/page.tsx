import {
  canonicalAlternates,
  ogVideo,
  pageOpenGraph,
  pageTwitter,
} from "@/lib/agent/page-metadata";
import { getGalleryCards } from "@/lib/content/content-data";
import { homeVideo, ogImage } from "@/lib/content/social-video";
import { Gallery } from "./_components/gallery";
import { GalleryOutline, GalleryStructuredData } from "./_components/gallery-outline";

import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: canonicalAlternates("/"),
  openGraph: pageOpenGraph("/", {
    image: ogImage,
    videos: ogVideo(homeVideo.contentUrl, homeVideo.width, homeVideo.height),
  }),
  twitter: pageTwitter({ image: ogImage }),
};

const Page = async () => (
  <>
    <GalleryStructuredData />
    <GalleryOutline />
    <Gallery cards={await getGalleryCards()} />
  </>
);

export default Page;
