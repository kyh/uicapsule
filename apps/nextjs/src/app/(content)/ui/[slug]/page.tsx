import { ResponsiveAside } from "@/app/(content)/_components/aside";
import { ContentRenderer } from "@/app/(content)/_components/content-renderer";
import { SandpackProvider } from "@/app/(content)/_components/sandpack";
import { getContentComponent } from "@/lib/content";

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
      options={{
        externalResources: [
          "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4",
        ],
      }}
      files={{
        "/App.tsx": contentComponent.previewCode,
        "/styles.css": defaultPreviewStyles,
        ...contentComponent.sourceCode,
      }}
    >
      <main className="relative flex h-[calc(100dvh-theme(spacing.16))] justify-center">
        <ContentRenderer contentComponent={contentComponent} />
        <ResponsiveAside contentComponent={contentComponent} />
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
