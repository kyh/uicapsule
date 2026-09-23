import { JsonLd } from "@/components/json-ld";
import { canonicalAlternates, pageOpenGraph, pageTwitter } from "@/lib/agent/page-metadata";
import { privacyPage } from "@/lib/agent/site-pages";
import { buildProsePageGraph } from "@/lib/agent/structured-data";

import { ProsePageView } from "../_components/prose-page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: canonicalAlternates(privacyPage.path),
  description: privacyPage.description,
  openGraph: pageOpenGraph(privacyPage.path, privacyPage.title, privacyPage.description),
  title: privacyPage.title,
  twitter: pageTwitter(privacyPage.title, privacyPage.description),
};

const Page = () => (
  <>
    <JsonLd node={buildProsePageGraph(privacyPage)} />
    <ProsePageView page={privacyPage} />
  </>
);

export default Page;
