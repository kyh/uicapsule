import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ContentFeed } from "@/app/(main)/(content)/_components/content-feed";
import { JsonLd } from "@/components/json-ld";
import { MediaReveal } from "@/components/media-reveal";
import { canonicalAlternates, pageOpenGraph } from "@/lib/agent/page-metadata";
import { buildComponentGraph } from "@/lib/agent/structured-data";
import { getAllContent, getFeedList } from "@/lib/content-data";

import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export const generateStaticParams = async () => {
  const all = await getAllContent();
  return all.map((c) => ({ slug: c.slug }));
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const component = (await getAllContent()).find((c) => c.slug === slug);
  if (!component) return { alternates: canonicalAlternates(`/ui/${slug}`) };

  const description =
    component.description ??
    `${component.name} — a live, installable React component in the UICapsule gallery.`;

  return {
    title: component.name,
    description,
    alternates: canonicalAlternates(`/ui/${component.slug}`),
    openGraph: pageOpenGraph(`/ui/${component.slug}`, component.name, description),
  };
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
  const feed = await getFeedList(slug);
  const component = feed.find((c) => c.slug === slug);
  if (!component) {
    notFound();
  }

  return (
    <>
      <JsonLd node={buildComponentGraph(component)} />
      {/* The feed is a full-bleed preview with no heading of its own; this
          gives the route the `h1` and description its canonical URL claims. */}
      <div className="sr-only">
        <h1>{component.name}</h1>
        {component.description ? <p>{component.description}</p> : null}
      </div>
      <ContentFeed initialSlug={slug} feed={feed} />
    </>
  );
};

const ContentFeedSkeleton = () => (
  <div className="flex h-full w-full flex-col gap-2 pb-2">
    <MediaReveal className="mx-auto h-full w-full max-w-[720px] rounded-md" />
  </div>
);
