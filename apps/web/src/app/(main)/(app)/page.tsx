import {
  canonicalAlternates,
  ogVideo,
  pageOpenGraph,
  pageTwitter,
} from "@/lib/agent/page-metadata";
import { getGalleryCards } from "@/lib/content-data";
import { homeVideo } from "@/lib/social-video";
import { Gallery } from "./_components/gallery";
import { GalleryOutline, GalleryStructuredData } from "./_components/gallery-outline";

import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: canonicalAlternates("/"),
  openGraph: pageOpenGraph("/", undefined, undefined, {
    videos: ogVideo(homeVideo.contentUrl, homeVideo.width, homeVideo.height),
  }),
  twitter: pageTwitter(),
};

const Page = async () => (
  <>
    <GalleryStructuredData />
    <GalleryOutline />
    <Gallery cards={await getGalleryCards()} />
  </>
);

export default Page;
