import { JsonLd } from "@/components/json-ld";
import { canonicalAlternates, pageOpenGraph } from "@/lib/agent/page-metadata";
import { contactPage } from "@/lib/agent/site-pages";
import { buildProsePageGraph } from "@/lib/agent/structured-data";

import { ProsePageView } from "../_components/prose-page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: canonicalAlternates(contactPage.path),
  description: contactPage.description,
  openGraph: pageOpenGraph(contactPage.path, contactPage.title, contactPage.description),
  title: contactPage.title,
};

const Page = () => (
  <>
    <JsonLd node={buildProsePageGraph(contactPage)} />
    <ProsePageView page={contactPage} />
  </>
);

export default Page;
