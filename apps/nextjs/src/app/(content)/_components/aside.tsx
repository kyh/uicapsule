import Link from "next/link";
import { SandpackCodeEditor } from "@codesandbox/sandpack-react";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { Button, buttonVariants } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@repo/ui/dialog";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import type { ContentComponent } from "@/lib/files";

type AsideProps = {
  contentComponent: ContentComponent;
};

export const Aside = ({ contentComponent }: AsideProps) => {
  return (
    <Card className="h-full">
      <h1 className="text-xl">{contentComponent.name}</h1>
      <p className="text-muted-foreground text-sm">
        {contentComponent.description}
      </p>
      <Dialog>
        <DialogTrigger className={buttonVariants({ variant: "outline" })}>
          View Source
        </DialogTrigger>
        <DialogContent>
          <SandpackCodeEditor />
        </DialogContent>
      </Dialog>
      {contentComponent.asSeenOn && (
        <div className="-mx-3 flex flex-col gap-2 border-t px-3 pt-3">
          <h2>As seen on</h2>
          <div className="flex flex-wrap gap-2">
            {contentComponent.asSeenOn.map((item) => (
              <a
                href={item.url}
                key={item.name}
                target="_blank"
                className="text-blue-600 hover:underline"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      )}
      {contentComponent.tags && (
        <div className="-mx-3 flex flex-col gap-2 border-t px-3 pt-3">
          <h2>Tags</h2>
          <div className="flex flex-wrap gap-2">
            {contentComponent.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {contentComponent.dependencies && (
        <div className="-mx-3 flex flex-col gap-2 border-t px-3 pt-3">
          <h2>Packages</h2>
          <div className="flex flex-wrap gap-2">
            {Object.keys(contentComponent.dependencies).map((dep) => (
              <Badge key={dep} variant="secondary">
                {dep}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {contentComponent.authors && (
        <div className="-mx-3 flex flex-col gap-2 border-t px-3 pt-3">
          <h2>Author</h2>
          <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:grayscale">
            {contentComponent.authors.map((author) => (
              <a href={author.url} key={author.name} target="_blank">
                <Avatar key={author.name}>
                  <AvatarImage src={author.avatarUrl} />
                  <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </a>
            ))}
          </div>
        </div>
      )}
      <div className="text-muted-foreground/70 -mx-3 mt-auto -mb-3 flex justify-between gap-4 border-t px-3 py-3">
        {contentComponent.previousSlug ? (
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/ui/${contentComponent.previousSlug}`}>
              <ArrowLeftIcon className="size-4" />
              <span className="sr-only">Previous</span>
            </Link>
          </Button>
        ) : (
          <div />
        )}
        {contentComponent.nextSlug ? (
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/ui/${contentComponent.nextSlug}`}>
              <span className="sr-only">Next</span>
              <ArrowRightIcon className="size-4" />
            </Link>
          </Button>
        ) : (
          <div />
        )}
      </div>
    </Card>
  );
};
