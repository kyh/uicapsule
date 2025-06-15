import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";

import { Resizable } from "@/components/resizable";
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
      <main className="flex min-h-[calc(100dvh-theme(spacing.32))] justify-center">
        <div className="flex p-4">
          <Resizable>
            <SandpackLayout className="h-full rounded-xl! shadow-[0_5px_100px_1px_#0000001a]">
              <SandpackPreview className="h-full!" />
            </SandpackLayout>
          </Resizable>
        </div>
        <div className="fixed right-0 h-[calc(100dvh-theme(spacing.16))] p-4">
          <Card className="h-full">
            <h1 className="text-xl">{contentComponent.name}</h1>
            <p className="text-muted-foreground text-sm">
              {contentComponent.description}
            </p>
            <div className="-mx-3 flex border-t px-3 pt-3">
              <h2>Category</h2>
              <div></div>
            </div>
            <div className="-mx-3 flex border-t px-3 pt-3">
              <h2>Author</h2>
            </div>
            <div className="-mx-3 flex border-t px-3 pt-3">
              <h2>Packages</h2>
            </div>
            <div className="-mx-3 flex border-t px-3 pt-3">
              <h2>As seen on</h2>
            </div>
            <Button variant="outline">View Source</Button>
            <div className="-mx-3 mt-auto -mb-3 flex justify-between gap-4 border-t px-3 py-3">
              <Button variant="ghost" size="sm">
                Previous
              </Button>
              <Button variant="ghost" size="sm">
                Next
              </Button>
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
