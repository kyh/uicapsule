import { JsonLd } from "@/components/json-ld";
import { canonicalAlternates, pageOpenGraph } from "@/lib/agent/page-metadata";
import { aboutPage } from "@/lib/agent/site-pages";
import { buildProsePageGraph } from "@/lib/agent/structured-data";

import { ProsePageView } from "../_components/prose-page";
import { Signature } from "../_components/signature";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: aboutPage.title,
  description: aboutPage.description,
  alternates: canonicalAlternates(aboutPage.path),
  openGraph: pageOpenGraph(aboutPage.path, aboutPage.title, aboutPage.description),
};

const Page = () => (
  <>
    <JsonLd node={buildProsePageGraph(aboutPage)} />
    <ProsePageView page={aboutPage}>
      <Signature className="text-foreground/50 mt-5 w-36" />
    </ProsePageView>
  </>
);

export default Page;
