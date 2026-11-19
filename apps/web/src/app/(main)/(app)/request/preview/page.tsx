import { Suspense } from "react";
import type { Metadata } from "next";

import { ReceiptPreview } from "./receipt-preview";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Receipt preview",
};

const Stage = async ({ searchParams }: Pick<PageProps<"/request/preview">, "searchParams">) => {
  const params = await searchParams;
  const [art] = [params.art].flat();

  return <ReceiptPreview art={art} />;
};

const Page = (props: PageProps<"/request/preview">) => (
  <main className="mx-auto flex min-h-[calc(100dvh-(--spacing(32)))] w-full max-w-5xl flex-col gap-8 p-6 sm:p-8 lg:gap-12 lg:p-20">
    <header className="flex max-w-2xl flex-col gap-3">
      <h1 className="text-3xl leading-snug lg:text-4xl">Have a UI request?</h1>
    </header>
    <Suspense>
      <Stage searchParams={props.searchParams} />
    </Suspense>
  </main>
);

export default Page;
