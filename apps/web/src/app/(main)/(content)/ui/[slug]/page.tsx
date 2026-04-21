import { Suspense } from "react";

import { ResponsiveAside } from "@/app/(main)/(content)/_components/aside";
import {
  ContentRenderer,
  ContentRendererSkeleton,
} from "@/app/(main)/(content)/_components/content-renderer";
import { publicCaller } from "@/trpc/server";

type Props = {
  params: Promise<{ slug: string }>;
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

const Content = async ({ params }: Props) => {
  const { slug } = await params;
  const contentComponent = await publicCaller.content.bySlug({ slug });

  return (
    <>
      <ContentRenderer contentComponent={contentComponent} />
      <ResponsiveAside contentComponent={contentComponent} />
    </>
  );
};
