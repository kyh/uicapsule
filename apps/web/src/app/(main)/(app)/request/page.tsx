import type { Metadata } from "next";

import { RequestForm } from "./request-form";

export const metadata: Metadata = {
  title: "Request a component",
};

const Page = () => {
  return (
    <main className="flex min-h-[calc(100dvh-(--spacing(32)))] max-w-3xl flex-col gap-4 p-8 lg:p-20">
      <h1 className="text-3xl leading-snug lg:text-4xl">Request a component</h1>
      <div className="text-muted-foreground flex flex-col gap-4 border-t pt-4 leading-relaxed">
        <p>
          Seen an interaction the web doesn't have yet? A hardware gesture, an OS transition, a
          physical mechanism, an instrument. Describe it and link to where you saw it. Requests
          become public GitHub issues; accepted ones get built, recorded, and credited to you.
        </p>
        <p>
          Have a screen recording to attach?{" "}
          <a
            href="https://github.com/kyh/uicapsule/issues/new?template=component-request.yml"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary underline decoration-dotted transition-colors"
          >
            File it on GitHub directly
          </a>{" "}
          where you can drop files in.
        </p>
      </div>
      <RequestForm className="mt-4" />
    </main>
  );
};

export default Page;
