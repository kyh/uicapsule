"use client";

import Link from "next/link";
import { Badge } from "@repo/ui/components/badge";
import { useWebHaptics } from "web-haptics/react";

import { MediaReveal } from "@/components/media-reveal";

interface ContentPreviewProps {
  slug: string;
  name: string;
  index: number;
  tags: string[];
  isNew: boolean;
  coverUrl?: string;
  coverType?: "image" | "video";
}

export const ContentPreview = ({
  slug,
  name,
  index,
  tags,
  isNew,
  coverUrl,
  coverType,
}: ContentPreviewProps) => {
  const { trigger } = useWebHaptics();
  return (
    <Link
      className="bg-background group flex flex-col justify-between gap-3 p-3 text-lg sm:p-6"
      href={`/ui/${slug}`}
      onClick={() => trigger("selection")}
    >
      <div className="relative">
        <MediaReveal
          className="aspect-video w-full"
          image={coverType === "image" ? coverUrl : undefined}
          video={coverType === "video" ? coverUrl : undefined}
        />
        {isNew && (
          <Badge
            className="bg-background/80 absolute top-2 left-2 z-10 backdrop-blur-sm"
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
