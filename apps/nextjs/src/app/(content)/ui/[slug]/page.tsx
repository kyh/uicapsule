import { SandpackProvider } from "@codesandbox/sandpack-react";
import { Button } from "@repo/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@repo/ui/drawer";
import { InfoIcon } from "lucide-react";

import { Aside } from "@/app/(content)/_components/aside";
import { Preview } from "@/app/(content)/_components/preview";
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
      <main className="relative flex h-[calc(100dvh-theme(spacing.16))] justify-center">
        <div className="flex md:p-4">
          <Preview />
          <Drawer>
            <DrawerTrigger asChild className="absolute top-2 right-9 md:hidden">
              <Button className="size-7" variant="secondary" size="icon">
                <InfoIcon className="text-muted-foreground size-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader className="sr-only">
                <DrawerTitle>Settings</DrawerTitle>
                <DrawerDescription>Settings options</DrawerDescription>
              </DrawerHeader>
              <Aside contentComponent={contentComponent} />
            </DrawerContent>
          </Drawer>
        </div>
        <aside className="absolute right-0 z-10 hidden h-full max-w-80 py-4 pr-6 md:block">
          <Aside contentComponent={contentComponent} />
        </aside>
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
