import { useState } from "react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { CopyButton } from "@repo/ui/components/copy-button";
import { ArrowLeftIcon, ArrowUpRightIcon, CheckIcon, SparklesIcon } from "lucide-react";

import { CoverMedia } from "./cover-media";

import type { GalleryEntry } from "./gallery-schema";

type Handoff = "idle" | "sending" | "sent" | "failed";

const handoffLabel = {
  failed: "Couldn't send, try again",
  idle: "Use this component",
  sending: "Use this component",
  sent: "Sent to the chat",
} satisfies Record<Handoff, string>;

const InstallCommand = ({ entry }: { entry: GalleryEntry }) =>
  entry.installable ? (
    <div className="bg-muted flex items-center gap-2 rounded-md py-1 pr-1 pl-3">
      <code className="min-w-0 flex-1 truncate text-xs select-all">{entry.install}</code>
      <CopyButton label="Copy install command" size="icon-sm" value={entry.install} />
    </div>
  ) : (
    <p className="text-muted-foreground text-sm">
      Hosted elsewhere, so there is no install command: the source lives at{" "}
      <code className="text-xs">{entry.sourceUrl}</code>.
    </p>
  );

/** One component, as `/ui/<slug>`'s info panel shows it, with the two ways out of the view. */
export const ComponentDetail = ({
  entry,
  onBack,
  onOpenLink,
  onUse,
}: {
  entry: GalleryEntry;
  onBack: () => void;
  onOpenLink: (url: string) => void;
  onUse: (entry: GalleryEntry) => Promise<boolean>;
}) => {
  const [handoff, setHandoff] = useState<Handoff>("idle");

  const handOff = async () => {
    setHandoff("sending");
    setHandoff((await onUse(entry)) ? "sent" : "failed");
  };

  return (
    <article className="flex flex-col">
      <div className="flex h-12 items-center gap-2 border-b px-2">
        <Button aria-label="Back to the gallery" onClick={onBack} size="icon-sm" variant="ghost">
          <ArrowLeftIcon />
        </Button>
        <h1 className="truncate font-mono text-sm uppercase">{entry.name}</h1>
      </div>
      <div className="grid md:grid-cols-[3fr_2fr]">
        <div className="p-3">
          <CoverMedia cover={entry.cover} />
        </div>
        <div className="flex flex-col gap-4 px-4 pt-1 pb-4 md:py-3 md:pl-1">
          <p className="text-sm text-pretty">{entry.description}</p>
          <ul className="flex flex-wrap gap-1">
            {entry.tags.map((tag) => (
              <li key={tag}>
                <Badge variant="secondary">{tag}</Badge>
              </li>
            ))}
          </ul>
          <InstallCommand entry={entry} />
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={handoff === "sending" || handoff === "sent"}
              loading={handoff === "sending"}
              onClick={() => {
                void handOff();
              }}
            >
              {handoff === "sent" ? <CheckIcon /> : <SparklesIcon />}
              {handoffLabel[handoff]}
            </Button>
            <Button
              onClick={() => {
                onOpenLink(entry.url);
              }}
              variant="outline"
            >
              Open on UICapsule
              <ArrowUpRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
};
