import { JsonLd } from "@/components/json-ld";
import {
  canonicalAlternates,
  pageOpenGraph,
  pageTwitter,
  shareCardImage,
} from "@/lib/agent/page-metadata";
import { termsPage } from "@/lib/agent/site-pages";
import { buildProsePageGraph } from "@/lib/agent/structured-data";

import { ProsePageView } from "../_components/prose-page";

import type { Metadata } from "next";

const image = shareCardImage(termsPage.path, termsPage.title);

export const metadata: Metadata = {
  alternates: canonicalAlternates(termsPage.path),
  description: termsPage.description,
  openGraph: pageOpenGraph(termsPage.path, termsPage.title, termsPage.description, { image }),
  title: termsPage.title,
  twitter: pageTwitter(termsPage.title, termsPage.description, { image }),
};

const Page = () => (
  <>
    <JsonLd node={buildProsePageGraph(termsPage)} />
    <ProsePageView page={termsPage} />
  </>
);

export default Page;
