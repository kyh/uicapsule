import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ComponentWorkspace } from "@/app/(main)/(content)/_components/component-workspace";
import { JsonLd } from "@/components/json-ld";
import { MediaReveal } from "@/components/media-reveal";
import {
  canonicalAlternates,
  ogVideo,
  pageOpenGraph,
  pageTwitter,
  shareCardImage,
} from "@/lib/agent/page-metadata";
import { buildComponentGraph } from "@/lib/agent/structured-data";
import { getAllContent } from "@/lib/content/content-data";
import { componentVideo } from "@/lib/content/social-video";

import type { Metadata } from "next";

type Props = Pick<PageProps<"/ui/[slug]">, "params">;

export const generateStaticParams = async () => {
  const all = await getAllContent();

  return all.map((c) => ({ slug: c.slug }));
};

export const generateMetadata = async ({ params }: Props) => {
  const { slug } = await params;
  const all = await getAllContent();
  const component = all.find((c) => c.slug === slug);

  if (!component) {
    return { alternates: canonicalAlternates(`/ui/${slug}`) } satisfies Metadata;
  }

  const { description } = component;
  const video = componentVideo(component);
  const image = shareCardImage(`/ui/${component.slug}`, component.name);

  return {
    alternates: canonicalAlternates(`/ui/${component.slug}`),
    description,
    openGraph: pageOpenGraph(`/ui/${component.slug}`, {
      description,
      image,
      title: component.name,
      videos: video ? ogVideo(video.contentUrl, video.width, video.height) : undefined,
    }),
    title: component.name,
    twitter: pageTwitter({ description, image, title: component.name }),
  } satisfies Metadata;
};

const Content = async ({ params }: Props) => {
  const { slug } = await params;
  const feed = await getAllContent();
  const component = feed.find((c) => c.slug === slug);

  if (!component) {
    notFound();
  }

  return (
    <>
      <JsonLd node={buildComponentGraph(component, componentVideo(component))} />
      <ComponentWorkspace initialSlug={slug} feed={feed} />
    </>
  );
};

const WorkspaceSkeleton = () => (
  <div className="h-[calc(100dvh-(--spacing(16)))] border-t p-3">
    <MediaReveal className="h-full w-full rounded-lg" />
  </div>
);

const Page = ({ params }: Props) => (
  <main className="relative">
    <Suspense fallback={<WorkspaceSkeleton />}>
      <Content params={params} />
    </Suspense>
  </main>
);

export default Page;
