import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";

import { getContentComponent } from "@/lib/files";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Page = async ({ params }: Props) => {
  const { slug } = await params;
  const contentComponent = await getContentComponent(slug);

  return (
    <SandpackProvider
      template="react-ts"
      customSetup={{ dependencies: contentComponent.dependencies }}
      options={{ externalResources: ["https://cdn.tailwindcss.com"] }}
      files={{
        "/App.tsx": contentComponent.previewCode,
        "/source.tsx": contentComponent.sourceCode,
        "/styles.css": defaultPreviewStyles,
      }}
    >
      <main className="grid min-h-[calc(100dvh-theme(spacing.32))] grid-cols-12 gap-4">
        <div className="col-span-2 p-4" />
        <div className="col-span-8 p-4">
          <SandpackLayout className="h-full rounded-xl! shadow-[0_5px_100px_1px_#0000001a]">
            <SandpackPreview className="h-full!" />
          </SandpackLayout>
        </div>
        <div className="col-span-2 p-4">
          <Card className="h-full">
            <h1 className="text-xl">{contentComponent.name}</h1>
            <p className="text-muted-foreground text-sm">
              {contentComponent.description}
            </p>
            <p className="-mx-5 flex border-t px-3 pt-3">Category</p>
            <p className="-mx-5 flex border-t px-3 pt-3">Author</p>
            <p className="-mx-5 flex border-t px-3 pt-3">Packages</p>
            <Button variant="outline">View Source</Button>
            <div className="-mx-5 mt-auto -mb-5 flex border-t px-3 py-3">
              <Button variant="ghost">Next</Button>
            </div>
          </Card>
        </div>
      </main>
    </SandpackProvider>
  );
};

const defaultPreviewStyles = `
* {
  box-sizing: border-box;
}

html,
body,
#root {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
`;

export default Page;
