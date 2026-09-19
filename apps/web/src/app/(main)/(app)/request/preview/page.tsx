import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReceiptPreview } from "./receipt-preview";

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Receipt preview",
};

// `?art=<variant>` picks the artwork; anything else falls back to one.
const Stage = async ({ searchParams }: Pick<PageProps<"/request/preview">, "searchParams">) => {
  const params = await searchParams;
  const [art] = [params.art].flat();
  return <ReceiptPreview art={art} />;
};

// Dev-only stage for the receipt so it can be iterated on without filing a real issue.
const Page = (props: PageProps<"/request/preview">) => {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-(--spacing(32)))] w-full max-w-5xl flex-col gap-8 p-6 sm:p-8 lg:gap-12 lg:p-20">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="text-3xl leading-snug lg:text-4xl">Have a UI request?</h1>
      </header>
      <Suspense>
        <Stage searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
};

export default Page;
