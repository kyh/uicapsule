import { Button } from "@repo/ui/components/button";
import { Spinner } from "@repo/ui/components/spinner";
import { Link2, Video, X } from "lucide-react";

import type { Capture, VideoStatus } from "./types";

const VideoNote = ({ video }: { video: VideoStatus }) => {
  if (video.state === "none") {
    return null;
  }

  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      {video.state === "working" && <Spinner className="size-3" />}
      {video.state === "attached" && <Video className="size-3" />}
      {video.state === "linked" && <Link2 className="size-3" />}
      {video.text}
    </p>
  );
};

export const CapturePreview = (props: { capture: Capture; onRemove: (id: string) => void }) => {
  const { element, page } = props.capture.selection;
  const { host } = new URL(page.url);

  return (
    <section className="flex flex-col gap-2">
      {props.capture.media.map((media) => (
        <figure
          key={media.id}
          className="relative overflow-hidden rounded-xl border border-border bg-muted"
        >
          {media.kind === "image" ? (
            <img
              src={media.previewUrl}
              alt="Captured area"
              className="max-h-56 w-full object-contain"
            />
          ) : (
            <video
              src={media.previewUrl}
              className="max-h-56 w-full"
              muted
              loop
              autoPlay
              playsInline
            />
          )}
          <figcaption className="absolute bottom-1.5 left-1.5 rounded-md bg-background/85 px-1.5 py-0.5 text-[11px] font-medium">
            {media.note}
          </figcaption>
          <Button
            variant="secondary"
            size="icon-xs"
            className="absolute top-1.5 right-1.5"
            aria-label={`Remove ${media.note.toLowerCase()}`}
            onClick={() => props.onRemove(media.id)}
          >
            <X />
          </Button>
        </figure>
      ))}
      <VideoNote video={props.capture.video} />
      <p className="truncate text-xs text-muted-foreground" title={page.url}>
        {element ? `${element.label} on ${host}` : `Area on ${host}`}
      </p>
    </section>
  );
};
