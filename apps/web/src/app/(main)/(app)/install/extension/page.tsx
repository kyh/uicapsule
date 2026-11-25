import { extensionGuide, extensionPage } from "@/lib/agent/site-pages";

import { InstallGuideView, installMetadata } from "../_components/install-guide";

export const metadata = installMetadata(extensionGuide);

const Page = () => <InstallGuideView guide={extensionGuide} page={extensionPage} />;

export default Page;
