"use client";

import Link from "next/link";
import { Badge } from "@repo/ui/components/badge";
import { useWebHaptics } from "web-haptics/react";

import type { Cover } from "@/lib/assets";
import { MediaReveal } from "@/components/media-reveal";

interface ContentPreviewProps {
  slug: string;
  name: string;
  index: number;
  tags: string[];
  isNew: boolean;
  cover?: Cover;
}

export const ContentPreview = ({ slug, name, index, tags, isNew, cover }: ContentPreviewProps) => {
  const { trigger } = useWebHaptics();
  return (
    <Link
      className="bg-background group flex flex-col justify-between gap-3 p-3 text-lg sm:p-6"
      href={`/ui/${slug}`}
      onClick={() => trigger("selection")}
    >
      <div className="grid">
        <MediaReveal
          className="col-start-1 row-start-1 aspect-video w-full"
          image={cover?.type === "image" ? cover.url : undefined}
          video={cover?.type === "video" ? cover.url : undefined}
        />
        {isNew && (
          <Badge
            className="bg-background/80 relative col-start-1 row-start-1 m-2 self-start justify-self-start backdrop-blur-sm"
            variant="outline"
          >
            New
          </Badge>
        )}
      </div>
      <div className="flex justify-between font-mono text-xs">
        <p className="group-hover:text-primary transition">{name}</p>
        <p className="text-muted-foreground/50 group-hover:text-primary/50 transition">
          {tags.includes("pages") ? (
            <Badge className="group-hover:text-primary" variant="secondary">
              Page
            </Badge>
          ) : (
            String(index).padStart(3, "0")
          )}
        </p>
      </div>
    </Link>
  );
};

export const ContentPreviewSkeleton = () => (
  <div className="bg-background group flex flex-col justify-between gap-3 p-3 sm:p-6">
    <MediaReveal className="aspect-video w-full" />
    <div className="flex justify-between text-xs">
      <div className="flex items-center gap-1">
        <div className="bg-muted h-4 w-24 rounded" />
      </div>
      <div className="bg-muted h-4 w-8 rounded" />
    </div>
  </div>
);
