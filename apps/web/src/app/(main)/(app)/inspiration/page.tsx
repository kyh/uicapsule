import { JsonLd } from "@/components/json-ld";
import { canonicalAlternates, pageOpenGraph } from "@/lib/agent/page-metadata";
import { inspirationPage } from "@/lib/agent/site-pages";
import { buildProsePageGraph } from "@/lib/agent/structured-data";

import { ProsePageView } from "../_components/prose-page";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: inspirationPage.title,
  description: inspirationPage.description,
  alternates: canonicalAlternates(inspirationPage.path),
  openGraph: pageOpenGraph(
    inspirationPage.path,
    inspirationPage.title,
    inspirationPage.description,
  ),
};

const Page = () => (
  <>
    <JsonLd node={buildProsePageGraph(inspirationPage)} />
    <ProsePageView page={inspirationPage} />
  </>
);

export default Page;
