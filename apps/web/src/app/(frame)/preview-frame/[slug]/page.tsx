import { Suspense } from "react";
import { notFound } from "next/navigation";

import type { ComponentType, ReactNode } from "react";

type Props = {
  params: Promise<{ slug: string }>;
};

const loadPreview = async (slug: string): Promise<ComponentType | null> => {
  try {
    const mod = (await import(`../../../../../../../content/${slug}/preview.tsx`)) as {
      default: ComponentType;
    };
    return mod.default;
  } catch {
    return null;
  }
};

const PreviewFramePage = ({ params }: Props) => {
  return (
    <Suspense fallback={<div className="bg-muted h-full w-full animate-pulse" />}>
      <PreviewContent params={params} />
    </Suspense>
  );
};

const PreviewContent = async ({ params }: Props): Promise<ReactNode> => {
  const { slug } = await params;
  const Preview = await loadPreview(slug);
  if (!Preview) notFound();
  return <Preview />;
};

export default PreviewFramePage;
