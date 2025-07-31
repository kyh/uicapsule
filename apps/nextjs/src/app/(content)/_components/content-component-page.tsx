"use client";

import { SandpackProvider } from "@codesandbox/sandpack-react";

import type { ContentComponent } from "@/lib/files";
import { AsideDesktop, AsideMobile } from "./aside";
import { Preview } from "./preview";

type ContentComponentPageProps = {
  contentComponent: ContentComponent;
};

export const ContentComponentPage = ({
  contentComponent,
}: ContentComponentPageProps) => {
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
          <AsideMobile contentComponent={contentComponent} />
        </div>
        <AsideDesktop contentComponent={contentComponent} />
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
