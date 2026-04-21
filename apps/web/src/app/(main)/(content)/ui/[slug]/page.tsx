import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";

import { ResponsiveAside } from "@/app/(main)/(content)/_components/aside";
import {
  ContentRenderer,
  ContentRendererSkeleton,
} from "@/app/(main)/(content)/_components/content-renderer";
import { publicCaller } from "@/trpc/server";

type Props = {
  params: Promise<{ slug: string }>;
};

export const generateStaticParams = async () => {
  const components = await publicCaller.content.list();
  return components.map((c) => ({ slug: c.slug }));
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
  return <CachedContent slug={slug} />;
};

const CachedContent = async ({ slug }: { slug: string }) => {
  "use cache";
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
