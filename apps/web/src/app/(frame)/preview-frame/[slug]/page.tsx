import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isRemoteContentComponent } from "@/lib/content/content-schema";

import { MediaReveal } from "@/components/media-reveal";
import { getFeedList } from "@/lib/content-data";

import type { ComponentType } from "react";

type Props = {
  params: Promise<{ slug: string }>;
};

export const generateStaticParams = async () => {
  const feed = await getFeedList();
  return feed.filter((c) => !isRemoteContentComponent(c)).map((c) => ({ slug: c.slug }));
};

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const loadPreview = async (slug: string): Promise<ComponentType | null> => {
  if (!SLUG_PATTERN.test(slug)) return null;
  try {
    const mod = (await import(`../../../../../../../content/${slug}/preview.tsx`)) as {
      default: ComponentType;
    };
    return mod.default;
  } catch {
    return null;
  }
};

const PreviewContent = async ({ params }: Props) => {
  const { slug } = await params;
  const Preview = await loadPreview(slug);
  if (!Preview) notFound();
  return <Preview />;
};

const PreviewFramePage = ({ params }: Props) => (
  <Suspense fallback={<MediaReveal className="h-full w-full" />}>
    <PreviewContent params={params} />
  </Suspense>
);

export default PreviewFramePage;
