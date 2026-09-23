import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContentFeed } from "@/app/(main)/(content)/_components/content-feed";
import { MediaReveal } from "@/components/media-reveal";
import { getAllContent } from "@/lib/content-data";
import { ogImage, siteConfig } from "@/lib/site-config";

interface Props {
  params: Promise<{ slug: string }>;
}

export const generateStaticParams = async () => {
  const all = await getAllContent();
  return all.map((c) => ({ slug: c.slug }));
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const all = await getAllContent();
  const component = all.find((c) => c.slug === slug);
  if (!component) {
    return {};
  }

  const title = component.name;
  const description = component.description ?? siteConfig.description;
  const url = `/ui/${slug}`;

  // openGraph/twitter replace the root layout's objects wholesale, so the image is restated.
  return {
    alternates: { canonical: url },
    description,
    openGraph: { description, images: [ogImage], title, type: "website", url },
    title,
    twitter: { card: "summary_large_image", description, images: [ogImage], title },
  };
};

const Content = async ({ params }: Props) => {
  const { slug } = await params;
  const feed = await getAllContent();
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

const Page = ({ params }: Props) => (
  <main className="relative flex h-[calc(100dvh-(--spacing(16)))] justify-center">
    <Suspense fallback={<ContentFeedSkeleton />}>
      <Content params={params} />
    </Suspense>
  </main>
);

export default Page;
