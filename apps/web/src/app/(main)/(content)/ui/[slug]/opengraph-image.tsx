import { renderComponentImage } from "@/lib/og/component-og-image";

export { componentImageSlugs as generateStaticParams } from "@/lib/og/component-og-image";

// Next reads these as constants; the page's title and description carry the name.
export const alt = "A live React component on UICapsule";
export const size = { height: 630, width: 1200 };
export const contentType = "image/png";

const Image = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  return await renderComponentImage(slug);
};

export default Image;
