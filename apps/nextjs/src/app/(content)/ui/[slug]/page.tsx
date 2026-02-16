import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";

import { ResponsiveAside } from "@/app/(content)/_components/aside";
import {
  ContentRenderer,
  ContentRendererSkeleton,
} from "@/app/(content)/_components/content-renderer";
import { publicCaller } from "@/trpc/server";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Page = ({ params }: Props) => {
  return (
    <main className="relative flex h-[calc(100dvh-(--spacing(16)))] justify-center">
      <Suspense fallback={<ContentRendererSkeleton />}>
        <Content params={params} />
      </Suspense>
    </main>
  );
};

export default Page;

const Content = async ({ params }: { params: Promise<{ slug: string }> }) => {
  "use cache";
  const { slug } = await params;
  cacheTag(`content-${slug}`);
  cacheLife("days");
  const contentComponent = await publicCaller.content.bySlug({ slug });

  return (
    <>
      <ContentRenderer contentComponent={contentComponent} />
      <ResponsiveAside contentComponent={contentComponent} />
    </>
  );
};
