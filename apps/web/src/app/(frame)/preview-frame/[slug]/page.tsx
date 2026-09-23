import { Suspense } from "react";
import { notFound } from "next/navigation";

import { MediaReveal } from "@/components/media-reveal";
import { getLocalSlugs } from "@/lib/content-data";

import type { ComponentType } from "react";

type Props = Pick<PageProps<"/preview-frame/[slug]">, "params">;

export const generateStaticParams = async () => {
  const slugs = await getLocalSlugs();
  return slugs.map((slug) => ({ slug }));
};

// Existence is decided by the content index, not by catching the import, so a preview that
// throws while loading fails the build instead of prerendering as a 404.
const loadPreview = async (slug: string): Promise<ComponentType | null> => {
  const localSlugs = await getLocalSlugs();
  if (!localSlugs.includes(slug)) {
    return null;
  }
  // Independent content checks verify each default export accepts empty preview props.
  const mod: { default: ComponentType } = await import(
    `../../../../../../../content/${slug}/preview.tsx`
  );
  return mod.default;
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
