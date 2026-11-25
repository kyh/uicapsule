import { JsonLd } from "@/components/json-ld";
import { installIndexPage } from "@/lib/agent/site-pages";
import { buildProsePageGraph } from "@/lib/agent/structured-data";

import { ProsePageView } from "../_components/prose-page";
import { installMetadata } from "./_components/install-guide";

export const metadata = installMetadata(installIndexPage);

const Page = () => (
  <>
    <JsonLd node={buildProsePageGraph(installIndexPage)} />
    <ProsePageView page={installIndexPage} />
  </>
);

export default Page;
