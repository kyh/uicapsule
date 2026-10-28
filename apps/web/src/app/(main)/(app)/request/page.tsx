import type { Metadata } from "next";

import { pageOpenGraph, pageTwitter, shareCardImage } from "@/lib/agent/page-metadata";
import { requestPage } from "@/lib/agent/site-pages";

import { RequestForm } from "./request-form";

const image = shareCardImage(requestPage.path, requestPage.title);

// No Markdown twin (a form, not prose), so a bare canonical rather than canonicalAlternates.
export const metadata: Metadata = {
  alternates: { canonical: requestPage.path },
  description: requestPage.description,
  openGraph: pageOpenGraph(requestPage.path, requestPage.title, requestPage.description, {
    image,
  }),
  title: requestPage.title,
  twitter: pageTwitter(requestPage.title, requestPage.description, { image }),
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
