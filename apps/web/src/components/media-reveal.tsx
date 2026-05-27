"use client";

import { useEffect, useRef, useState } from "react";
import { ImageGeneration, type ImageGenerationHandle } from "img-fx";
import { cn } from "@repo/ui/lib/utils";

type MediaRevealProps = {
  className?: string;
  borderRadius?: number;
  image?: string;
  video?: string;
};

// Animated img-fx "generation" shader used as the loading skeleton. Given an
// image it reveals it natively; given a video it cross-fades the video in once
// it has data (then pauses the shared WebGL renderer). With no media it is just
// the animated skeleton, a drop-in replacement for a pulsing placeholder.
export const MediaReveal = ({ className, borderRadius = 0, image, video }: MediaRevealProps) => {
  const handle = useRef<ImageGenerationHandle>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!image) return;
    const id = window.setTimeout(() => {
      handle.current?.triggerReveal({ hold: "manual" });
    }, 600);
    return () => window.clearTimeout(id);
  }, [image]);

  // Only video uses a separate overlay; an image is painted by the shader's own
  // reveal canvas, so the shader layer stays in place for it.
  const videoRevealed = Boolean(video) && revealed;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <ImageGeneration
        ref={handle}
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: videoRevealed ? 0 : 1 }}
        preset="pixels-organic"
        theme="auto"
        images={image}
        paused={videoRevealed}
        borderRadius={borderRadius}
      >
        <div style={{ width: "100%", height: "100%" }} />
      </ImageGeneration>
      {video && (
        <video
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: revealed ? 1 : 0 }}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setRevealed(true)}
        >
          <source src={video} type="video/mp4" />
        </video>
      )}
    </div>
  );
};
