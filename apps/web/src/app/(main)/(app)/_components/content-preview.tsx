"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Badge } from "@repo/ui/components/badge";
import { ImageGeneration, type ImageGenerationHandle } from "img-fx";
import { useWebHaptics } from "web-haptics/react";

// img-fx WebGL "generation" shader acts as the loading skeleton. For image
// covers it reveals the image natively; for video covers it cross-fades out
// once the video has data, then pauses to free the renderer.
const CoverReveal = ({ src, type }: { src: string; type: "image" | "video" }) => {
  const handle = useRef<ImageGenerationHandle>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (type !== "image") return;
    const id = window.setTimeout(() => {
      handle.current?.triggerReveal({ hold: "manual" });
      setRevealed(true);
    }, 600);
    return () => window.clearTimeout(id);
  }, [type, src]);

  const videoRevealed = type === "video" && revealed;

  return (
    <>
      <ImageGeneration
        ref={handle}
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: videoRevealed ? 0 : 1 }}
        preset="pixels-organic"
        theme="auto"
        images={type === "image" ? src : undefined}
        paused={videoRevealed}
        borderRadius={0}
      >
        <div style={{ width: "100%", height: "100%" }} />
      </ImageGeneration>
      {type === "video" && (
        <video
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: revealed ? 1 : 0 }}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setRevealed(true)}
        >
          <source src={src} type="video/mp4" />
        </video>
      )}
    </>
  );
};

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
      <div className="relative aspect-video overflow-hidden">
        {coverUrl && coverType && <CoverReveal src={coverUrl} type={coverType} />}
      </div>
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
      <div className="aspect-video overflow-hidden">
        <div className="bg-muted h-full w-full animate-pulse rounded" />
      </div>
      <div className="flex justify-between text-xs">
        <div className="flex items-center gap-1">
          <div className="bg-muted h-4 w-24 animate-pulse rounded" />
        </div>
        <div className="bg-muted h-4 w-8 animate-pulse rounded" />
      </div>
    </div>
  );
};
