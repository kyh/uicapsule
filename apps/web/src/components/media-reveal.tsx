"use client";

import { useEffect, useRef, useState } from "react";
import { ImageGeneration, type ImageGenerationHandle } from "img-fx";
import { cn } from "@repo/ui/lib/utils";

// Minimum time the generative shader stays on screen before the media is
// revealed, so the effect is actually perceptible even when the media is
// cached and loads instantly.
const MIN_SHADER_MS = 1800;

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
  const [minElapsed, setMinElapsed] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setMinElapsed(true), MIN_SHADER_MS);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!image || !minElapsed) return;
    handle.current?.triggerReveal({ hold: "manual" });
  }, [image, minElapsed]);

  // Only video uses a separate overlay; an image is painted by the shader's own
  // reveal canvas, so the shader layer stays in place for it.
  const videoRevealed = Boolean(video) && videoLoaded && minElapsed;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <ImageGeneration
        ref={handle}
        className="absolute! inset-0 transition-opacity duration-700"
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
          style={{ opacity: videoRevealed ? 1 : 0 }}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
        >
          <source src={video} type="video/mp4" />
        </video>
      )}
    </div>
  );
};
