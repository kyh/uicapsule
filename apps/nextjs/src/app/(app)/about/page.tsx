import { Signature } from "../_components/signature";

const Page = () => {
  return (
    <main className="flex min-h-[calc(100dvh-theme(spacing.32))] max-w-3xl flex-col gap-4 p-8 lg:p-20">
      <h1 className="text-3xl leading-snug lg:text-4xl">
        A curated collection of components that spark joy.
      </h1>
      <div className="text-muted-foreground flex flex-col gap-4 border-t pt-4 leading-relaxed">
        <p>
          Over the years I've collected UI pieces that I've found thoughtfully
          crafted, animations that feel natural, and interactions that solve
          problems with elegance.
        </p>
        <p>This is that collection as open source, copy paste-able code.</p>
        <Signature className="text-foreground/50 mt-5 w-36" />
      </div>
    </main>
  );
};

export default Page;
