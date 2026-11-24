import { JsonLd } from "@/components/json-ld";
import {
  canonicalAlternates,
  pageOpenGraph,
  pageTwitter,
  shareCardImage,
} from "@/lib/agent/page-metadata";
import { privacyPage } from "@/lib/agent/site-pages";
import { buildProsePageGraph } from "@/lib/agent/structured-data";

import { ProsePageView } from "../_components/prose-page";

import type { Metadata } from "next";

const image = shareCardImage(privacyPage.path, privacyPage.title);

export const metadata: Metadata = {
  alternates: canonicalAlternates(privacyPage.path),
  description: privacyPage.description,
  openGraph: pageOpenGraph(privacyPage.path, {
    description: privacyPage.description,
    image,
    title: privacyPage.title,
  }),
  title: privacyPage.title,
  twitter: pageTwitter({ description: privacyPage.description, image, title: privacyPage.title }),
};

const Page = () => (
  <>
    <JsonLd node={buildProsePageGraph(privacyPage)} />
    <ProsePageView page={privacyPage} />
  </>
);

export default Page;
