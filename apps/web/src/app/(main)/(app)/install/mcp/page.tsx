import { mcpGuide, mcpPage } from "@/lib/agent/site-pages";

import { InstallGuideView, installMetadata } from "../_components/install-guide";

export const metadata = installMetadata(mcpGuide);

const Page = () => <InstallGuideView guide={mcpGuide} page={mcpPage} />;

export default Page;
