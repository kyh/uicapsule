import { Suspense } from "react";
import { notFound } from "next/navigation";

import { MediaReveal } from "@/components/media-reveal";
import { getAllContent } from "@/lib/content-data";

import type { ComponentType } from "react";

interface Props {
  params: Promise<{ slug: string }>;
}

export const generateStaticParams = async () => {
  const all = await getAllContent();
  return all.filter((c) => c.type === "local").map((c) => ({ slug: c.slug }));
};

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/u;

const loadPreview = async (slug: string): Promise<ComponentType | null> => {
  if (!SLUG_PATTERN.test(slug)) {
    return null;
  }
  try {
    // Independent content checks verify each default export accepts empty preview props.
    const mod: { default: ComponentType } = await import(
      `../../../../../../../content/${slug}/preview.tsx`
    );
    return mod.default;
  } catch {
    return null;
  }
};

const PreviewContent = async ({ params }: Props) => {
  const { slug } = await params;
  const Preview = await loadPreview(slug);
  if (!Preview) {
    notFound();
  }
  return <Preview />;
};

const PreviewFramePage = ({ params }: Props) => (
  <Suspense fallback={<MediaReveal className="h-full w-full" />}>
    <PreviewContent params={params} />
  </Suspense>
);

export default PreviewFramePage;
