import { Suspense } from "react";

import { ResponsiveAside } from "@/app/(content)/_components/aside";
import {
  ContentRenderer,
  ContentRendererSkeleton,
} from "@/app/(content)/_components/content-renderer";
import { ContentProvider } from "@/app/(content)/_components/sandpack";
import { caller } from "@/trpc/server";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Page = ({ params }: Props) => {
  return (
    <Suspense
      fallback={
        <main className="relative flex h-[calc(100dvh-(--spacing(16)))] justify-center">
          <ContentRendererSkeleton />
        </main>
      }
    >
      <Content params={params} />
    </Suspense>
  );
};

export default Page;

const Content = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const contentComponent = await caller.content.bySlug({ slug });

  return (
    <ContentProvider contentComponent={contentComponent}>
      <main className="relative flex h-[calc(100dvh-(--spacing(16)))] justify-center">
        <ContentRenderer contentComponent={contentComponent} />
        <ResponsiveAside contentComponent={contentComponent} />
      </main>
    </ContentProvider>
  );
};
