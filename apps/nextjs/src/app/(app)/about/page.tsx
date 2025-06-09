import Link from "next/link";
import { ProfileAvatar } from "@repo/ui/avatar";
import { Button } from "@repo/ui/button";

const Page = () => {
  return (
    <main className="flex min-h-[calc(100dvh-theme(spacing.32))] max-w-3xl flex-col gap-4 p-8 lg:p-20">
      <h1 className="text-3xl leading-snug lg:text-4xl">
        UICapsule is a curated collection of components for builders who care
        about the details.
      </h1>
      <p className="text-muted-foreground flex items-center gap-2">
        <ProfileAvatar
          className="size-6"
          src="https://avatars.githubusercontent.com/u/4271679?v=4"
          displayName="Kaiyu Hsu"
        />
        <span>
          Sourced by &nbsp;
          <Link href="https://x.com/kaiyuhsu" target="_blank">
            Kaiyu Hsu
          </Link>
        </span>
      </p>
      <div className="text-muted-foreground flex flex-col gap-4 border-t pt-4 leading-relaxed">
        <p>
          Over the years I've collected UI pieces that I've found thoughtfully
          crafted, animations that feel natural, and interactions that solve
          real problems with elegance. This is that collection, open sourced.
        </p>
        <p>
          If you'd like to add to the collection, it costs nothing to submit.
          Whether you're an agency, small studio, freelancer, student, or any
          type of builder; I'd love to see what incredible design you've been
          working on.
        </p>
        <Button className="w-fit">Submit</Button>
      </div>
    </main>
  );
};

export default Page;
