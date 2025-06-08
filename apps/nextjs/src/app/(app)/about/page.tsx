import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";

const Page = () => {
  return (
    <main className="flex min-h-[calc(100dvh-theme(spacing.32))] flex-col gap-4 p-8 lg:p-20">
      <h1 className="text-3xl leading-snug lg:text-4xl">
        UICapsule is a hand curated selection of components aiming to support
        developers and designers in their creative process.
      </h1>
      <p className="text-muted-foreground flex items-center gap-2 text-xl">
        <Avatar>
          <AvatarImage src="https://avatars.githubusercontent.com/u/4271679?v=4" />
          <AvatarFallback>KH</AvatarFallback>
        </Avatar>
        Made by Kaiyu Hsu
      </p>
    </main>
  );
};

export default Page;
