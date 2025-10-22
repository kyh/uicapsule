import { ResponsiveAside } from "@/app/(content)/_components/aside";
import { ContentRenderer } from "@/app/(content)/_components/content-renderer";
import { ContentProvider } from "@/app/(content)/_components/sandpack";
import { caller } from "@/trpc/server";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

const Page = async ({ params }: Props) => {
  const { slug } = await params;
  const contentComponent = await caller.content.bySlug({ slug });

  return (
    <ContentProvider contentComponent={contentComponent}>
      <main className="relative flex h-[calc(100dvh-theme(spacing.16))] justify-center">
        <ContentRenderer contentComponent={contentComponent} />
        <ResponsiveAside contentComponent={contentComponent} />
      </main>
    </ContentProvider>
  );
};

export default Page;
