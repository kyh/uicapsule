import { Button } from "@repo/ui/components/button";
import { Check, ExternalLink } from "lucide-react";

import type { Filed } from "./types";

export const FiledCard = (props: { filed: Filed; onReset: () => void }) => (
  <section className="flex flex-col items-start gap-3 rounded-xl border border-border p-4">
    <p className="flex items-center gap-2 font-medium">
      <Check className="size-4" />
      {props.filed.number ? `Request #${props.filed.number} filed` : "Request filed"}
    </p>
    <p className="text-sm text-muted-foreground">
      It&apos;s public on GitHub. If it gets built, it lands in the gallery with your credit.
    </p>
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          void browser.tabs.create({ url: props.filed.url });
        }}
      >
        <ExternalLink />
        View request
      </Button>
      <Button size="sm" onClick={props.onReset}>
        New request
      </Button>
    </div>
  </section>
);
