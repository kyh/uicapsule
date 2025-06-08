import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";

const Page = () => {
  return (
    <main className="flex min-h-[calc(100dvh-theme(spacing.32))] max-w-3xl flex-col gap-4 p-8 lg:p-20">
      <h1 className="text-3xl leading-snug lg:text-4xl">
        UICapsule is a hand curated selection of components aiming to support
        developers and designers in their creative process.
      </h1>
      <p className="text-muted-foreground flex items-center gap-2 text-xl">
        <Avatar>
          <AvatarImage src="https://avatars.githubusercontent.com/u/4271679?v=4" />
          <AvatarFallback>KH</AvatarFallback>
        </Avatar>
        Sourced by Kaiyu Hsu
      </p>
      <p className="text-muted-foreground border-t pt-4">
        I've collected UI gems over the course of my career and assembled a
        private collection of components. This is that collection made public. I
        hope you find it useful.
      </p>
    </main>
  );
};

export default Page;
