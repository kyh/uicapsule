import { JsonLd } from "@/components/json-ld";
import { canonicalAlternates, pageOpenGraph, pageTwitter } from "@/lib/agent/page-metadata";
import { termsPage } from "@/lib/agent/site-pages";
import { buildProsePageGraph } from "@/lib/agent/structured-data";

import { ProsePageView } from "../_components/prose-page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: canonicalAlternates(termsPage.path),
  description: termsPage.description,
  openGraph: pageOpenGraph(termsPage.path, termsPage.title, termsPage.description),
  title: termsPage.title,
  twitter: pageTwitter(termsPage.title, termsPage.description),
};

const Page = () => (
  <>
    <JsonLd node={buildProsePageGraph(termsPage)} />
    <ProsePageView page={termsPage} />
  </>
);

export default Page;
