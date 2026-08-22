import { JsonLd } from "@/components/json-ld";
import { canonicalAlternates, pageOpenGraph } from "@/lib/agent/page-metadata";
import { privacyPage } from "@/lib/agent/site-pages";
import { buildProsePageGraph } from "@/lib/agent/structured-data";

import { ProsePageView } from "../_components/prose-page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: privacyPage.title,
  description: privacyPage.description,
  alternates: canonicalAlternates(privacyPage.path),
  openGraph: pageOpenGraph(privacyPage.path, privacyPage.title, privacyPage.description),
};

const Page = () => (
  <>
    <JsonLd node={buildProsePageGraph(privacyPage)} />
    <ProsePageView page={privacyPage} />
  </>
);

export default Page;
