import { Sandpack } from "@codesandbox/sandpack-react";

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
    <main className="grid min-h-[calc(100dvh-theme(spacing.32))] grid-cols-4 gap-4">
      <div />
      <div className="col-span-2">
        <Sandpack
          template="react-ts"
          customSetup={{ dependencies: contentComponent.dependencies }}
          options={{ externalResources: ["https://cdn.tailwindcss.com"] }}
          files={{
            "/App.tsx": contentComponent.previewCode,
            "/source.tsx": contentComponent.sourceCode,
          }}
        />
      </div>
      <div />
    </main>
  );
};

export default Page;
