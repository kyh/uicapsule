import type { Metadata } from "next";

import { RequestForm } from "./request-form";

export const metadata: Metadata = {
  title: "Request a component",
};

const Page = () => {
  return (
    <main className="mx-auto flex min-h-[calc(100dvh-(--spacing(32)))] w-full max-w-5xl flex-col gap-8 p-6 sm:p-8 lg:gap-12 lg:p-20">
      <header className="flex max-w-2xl flex-col gap-3">
        <h1 className="text-3xl leading-snug lg:text-4xl">Request a component</h1>
        <p className="text-muted-foreground leading-relaxed">
          Seen an interaction the web doesn't have yet? Show it. Accepted requests get built,
          recorded, and credited to you.
        </p>
      </header>
      <RequestForm />
    </main>
  );
};

export default Page;
