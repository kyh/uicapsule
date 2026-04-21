import { Suspense } from "react";
import { notFound } from "next/navigation";

import type { ComponentType } from "react";

type Props = {
  params: Promise<{ slug: string }>;
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
  <Suspense fallback={<div className="bg-muted h-full w-full animate-pulse" />}>
    <PreviewContent params={params} />
  </Suspense>
);

export default PreviewFramePage;
