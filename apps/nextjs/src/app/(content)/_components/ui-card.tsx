import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

type UiCardProps = {
  name: string;
  description: string;
  tags?: string[];
  dependencies?: Record<string, string>;
  authors?: { name: string; url: string; avatarUrl: string }[];
  asSeenOn?: { name: string; url: string; avatarUrl: string }[];
};

export const UiCard = ({
  name,
  description,
  tags,
  dependencies,
  authors,
  asSeenOn,
}: UiCardProps) => {
  return (
    <Card className="h-full">
      <h1 className="text-xl">{name}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
      {tags && (
        <div className="-mx-3 flex border-t px-3 pt-3">
          <h2>Tags</h2>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </div>
      )}
      {dependencies && (
        <div className="-mx-3 flex border-t px-3 pt-3">
          <h2>Packages</h2>
          <div className="flex flex-wrap gap-2">
            {Object.keys(dependencies).map((dep) => (
              <Badge key={dep} variant="secondary">
                {dep}
              </Badge>
            ))}
          </div>
        </div>
      )}
      {authors && (
        <div className="-mx-3 flex border-t px-3 pt-3">
          <h2>Author</h2>
          <div className="flex flex-wrap gap-2">
            {authors.map((author) => (
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
      {asSeenOn && (
        <div className="-mx-3 flex border-t px-3 pt-3">
          <h2>As seen on</h2>
          <div className="flex flex-wrap gap-2">
            {asSeenOn.map((item) => (
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
      <Button variant="outline">View Source</Button>
      <div className="text-muted-foreground/70 -mx-3 mt-auto -mb-3 flex justify-between gap-4 border-t px-3 py-3">
        <Button variant="ghost" size="sm">
          <ArrowLeftIcon className="size-4" />
          <span className="sr-only">Previous</span>
        </Button>
        <Button variant="ghost" size="sm">
          <span className="sr-only">Next</span>
          <ArrowRightIcon className="size-4" />
        </Button>
      </div>
    </Card>
  );
};
