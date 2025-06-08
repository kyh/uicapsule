import { ProfileAvatar } from "@repo/ui/avatar";

const Page = () => {
  return (
    <main className="flex min-h-[calc(100dvh-theme(spacing.32))] max-w-3xl flex-col gap-4 p-8 lg:p-20">
      <h1 className="text-3xl leading-snug lg:text-4xl">
        UICapsule is a curated collection of components for developers and
        designers.
      </h1>
      <p className="flex items-center gap-2 text-lg">
        <ProfileAvatar
          className="size-8"
          src="https://avatars.githubusercontent.com/u/4271679?v=4"
          displayName="Kaiyu Hsu"
        />
        Sourced by Kaiyu Hsu
      </p>
      <p className="text-muted-foreground border-t pt-4 leading-relaxed">
        I've spent years collecting and crafting UI components that I love—my
        own private arsenal of gems. Now I'm sharing that collection with you.
        Hope it's as useful for your projects as it's been for mine
      </p>
    </main>
  );
};

export default Page;
