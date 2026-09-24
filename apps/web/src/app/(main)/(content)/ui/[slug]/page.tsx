import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ContentFeed } from "@/app/(main)/(content)/_components/content-feed";
import { JsonLd } from "@/components/json-ld";
import { MediaReveal } from "@/components/media-reveal";
import { canonicalAlternates, pageOpenGraph, pageTwitter } from "@/lib/agent/page-metadata";
import { buildComponentGraph } from "@/lib/agent/structured-data";
import { getAllContent } from "@/lib/content-data";

import type { Metadata } from "next";

type Props = Pick<PageProps<"/ui/[slug]">, "params">;

export const generateStaticParams = async () => {
  const all = await getAllContent();
  return all.map((c) => ({ slug: c.slug }));
};

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params;
  const all = await getAllContent();
  const component = all.find((c) => c.slug === slug);
  if (!component) {
    return { alternates: canonicalAlternates(`/ui/${slug}`) };
  }

  const description =
    component.description ??
    `${component.name} — a live, installable React component in the UICapsule gallery.`;

  return {
    alternates: canonicalAlternates(`/ui/${component.slug}`),
    description,
    openGraph: pageOpenGraph(`/ui/${component.slug}`, component.name, description),
    title: component.name,
    twitter: pageTwitter(component.name, description),
  };
};

const Content = async ({ params }: Props) => {
  const { slug } = await params;
  const feed = await getAllContent();
  // Looked up rather than `.some()` because the JSON-LD and the sr-only
  // heading below both need the component itself.
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

const Page = ({ params }: Props) => (
  <main className="relative flex h-[calc(100dvh-(--spacing(16)))] justify-center">
    <Suspense fallback={<ContentFeedSkeleton />}>
      <Content params={params} />
    </Suspense>
  </main>
);

export default Page;
