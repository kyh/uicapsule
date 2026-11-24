import { Suspense } from "react";
import { notFound } from "next/navigation";

import { MediaReveal } from "@/components/media-reveal";
import { getLocalSlugs } from "@/lib/content/content-data";

import type { ComponentType } from "react";

type Props = Pick<PageProps<"/preview-frame/[slug]">, "params">;

export const ensureStatic = "navigation";

export const generateStaticParams = async () => {
  const slugs = await getLocalSlugs();

  return slugs.map((slug) => ({ slug }));
};

const loadPreview = async (slug: string) => {
  const localSlugs = await getLocalSlugs();

  if (!localSlugs.includes(slug)) {
    return null;
  }

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
