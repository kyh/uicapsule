import { SandpackProvider } from "@codesandbox/sandpack-react";

import { Preview } from "@/app/(content)/_components/preview";
import { UiCard } from "@/app/(content)/_components/ui-card";
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
          <Preview />
        </div>
        <div className="fixed right-0 h-[calc(100dvh-theme(spacing.16))] p-4">
          <UiCard
            name={contentComponent.name}
            description={contentComponent.description}
          />
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
