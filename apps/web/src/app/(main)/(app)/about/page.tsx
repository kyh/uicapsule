import { Signature } from "../_components/signature";

const Page = () => {
  return (
    <main className="flex min-h-[calc(100dvh-(--spacing(32)))] max-w-3xl flex-col gap-4 p-8 lg:p-20">
      <h1 className="text-3xl leading-snug lg:text-4xl">
        A curated collection of components that spark joy.
      </h1>
      <div className="text-muted-foreground flex flex-col gap-4 border-t pt-4 leading-relaxed">
        <p>
          Each one starts as a designer's brief and gets built with an AI. The two go back and forth
          until it's polished enough to ship: recorded, documented, pasteable.
        </p>
        <p>
          The brief is always an interaction the web doesn't have yet: hardware gestures, OS motion,
          physical mechanisms. All of it is open source.
        </p>
        <Signature className="text-foreground/50 mt-5 w-36" />
      </div>
    </main>
  );
};

export default Page;
