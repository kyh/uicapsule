import type { Metadata } from "next";

import { RequestForm } from "./request-form";

export const metadata: Metadata = {
  title: "Request a component",
};

const Page = () => (
  <main className="mx-auto flex min-h-[calc(100dvh-(--spacing(32)))] w-full max-w-5xl flex-col gap-8 p-6 sm:p-8 lg:gap-12 lg:p-20">
    <header className="flex max-w-2xl flex-col gap-3">
      <h1 className="text-3xl leading-snug lg:text-4xl">Have a UI request?</h1>
    </header>
    <RequestForm />
  </main>
);

export default Page;
