import { Button } from "@repo/ui/button";
import { Card } from "@repo/ui/card";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

type UiCardProps = {
  name: string;
  description: string;
};

export const UiCard = ({ name, description }: UiCardProps) => {
  return (
    <Card className="h-full">
      <h1 className="text-xl">{name}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
      <div className="-mx-3 flex border-t px-3 pt-3">
        <h2>Category</h2>
        <div></div>
      </div>
      <div className="-mx-3 flex border-t px-3 pt-3">
        <h2>Author</h2>
      </div>
      <div className="-mx-3 flex border-t px-3 pt-3">
        <h2>Packages</h2>
      </div>
      <div className="-mx-3 flex border-t px-3 pt-3">
        <h2>As seen on</h2>
      </div>
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
