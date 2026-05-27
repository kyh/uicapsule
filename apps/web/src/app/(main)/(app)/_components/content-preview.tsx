"use client";

import Link from "next/link";
import { Badge } from "@repo/ui/components/badge";
import { useWebHaptics } from "web-haptics/react";

import { MediaReveal } from "@/components/media-reveal";

type ContentPreviewProps = {
  slug: string;
  name: string;
  index: number;
  tags: string[];
  coverUrl?: string;
  coverType?: "image" | "video";
};

export const ContentPreview = ({
  slug,
  name,
  index,
  tags,
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
      <MediaReveal
        className="aspect-video w-full"
        image={coverType === "image" ? coverUrl : undefined}
        video={coverType === "video" ? coverUrl : undefined}
      />
      <div className="flex justify-between font-mono text-xs">
        <p className="group-hover:text-primary flex items-center gap-1 transition">{name} </p>
        <p className="text-muted-foreground/50 group-hover:text-primary/50 transition">
          {tags.includes("landing-pages") || tags.includes("dashboard-pages") ? (
            <Badge className="group-hover:text-primary" variant="secondary">
              Landing Page
            </Badge>
          ) : (
            String(index).padStart(3, "0")
          )}
        </p>
      </div>
    </Link>
  );
};

export const ContentPreviewSkeleton = () => {
  return (
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
};
