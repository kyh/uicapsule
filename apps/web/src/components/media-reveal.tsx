"use client";

import { useEffect, useRef, useState } from "react";
import { ImageGeneration, type ImageGenerationHandle } from "img-fx";
import { cn } from "@repo/ui/lib/utils";

type MediaRevealProps = {
  className?: string;
  image?: string;
  video?: string;
};

// An img-fx "generation" shader sits on top as the loading skeleton and
// dissolves away to reveal the media underneath. For an image, img-fx paints
// and holds it on its own canvas, so the shader layer stays in place. With no
// media it is just the animated skeleton, a drop-in for a pulsing placeholder.
// The corner radius is auto-detected from the container's border-radius.
export const MediaReveal = ({ className, image, video }: MediaRevealProps) => {
  const handle = useRef<ImageGenerationHandle>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [shaderPaused, setShaderPaused] = useState(false);

  useEffect(() => {
    if (!image) return;
    handle.current?.triggerReveal({ hold: "manual" });
  }, [image]);

  // Reveal the video as soon as it can paint a frame. The readyState check
  // covers videos that were already buffered (e.g. cached) before the event
  // listeners attached and so never fire loadeddata/canplay.
  useEffect(() => {
    if (!video) return;
    const el = videoRef.current;
    if (el && el.readyState >= 2) setRevealed(true);
  }, [video]);

  const fadeOut = Boolean(video) && revealed;

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {video && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setRevealed(true)}
          onCanPlay={() => setRevealed(true)}
        >
          <source src={video} type="video/mp4" />
        </video>
      )}
      <ImageGeneration
        ref={handle}
        className="absolute! inset-0 transition-opacity duration-700"
        style={{ opacity: fadeOut ? 0 : 1 }}
        preset="pixels-organic"
        theme="auto"
        images={image}
        paused={shaderPaused}
        onTransitionEnd={() => {
          if (fadeOut) setShaderPaused(true);
        }}
      >
        <div style={{ width: "100%", height: "100%" }} />
      </ImageGeneration>
    </div>
  );
};
