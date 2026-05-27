import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ContentFeed } from "@/app/(main)/(content)/_components/content-feed";
import { MediaReveal } from "@/components/media-reveal";
import { publicCaller } from "@/trpc/server";

type Props = {
  params: Promise<{ slug: string }>;
};

const Page = ({ params }: Props) => {
  return (
    <main className="relative flex h-[calc(100dvh-(--spacing(16)))] justify-center">
      <Suspense fallback={<ContentFeedSkeleton />}>
        <Content params={params} />
      </Suspense>
    </main>
  );
};

export default Page;

const Content = async ({ params }: Props) => {
  const { slug } = await params;
  const feed = await publicCaller.content.feedList();
  if (!feed.some((c) => c.slug === slug)) {
    notFound();
  }

  return <ContentFeed initialSlug={slug} feed={feed} />;
};

const ContentFeedSkeleton = () => (
  <div className="flex h-full w-full flex-col gap-2 pb-2">
    <MediaReveal className="mx-auto h-full w-full max-w-[720px] rounded-md" />
  </div>
);
