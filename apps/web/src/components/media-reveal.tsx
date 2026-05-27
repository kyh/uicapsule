"use client";

import { useEffect, useRef, useState } from "react";
import { ImageGeneration, setMaxDpr, type ImageGenerationHandle } from "img-fx";
import { cn } from "@repo/ui/lib/utils";

// The shaders are a decorative loading effect, so render them at DPR 1 — the
// extra fragment cost of retina resolution isn't worth it across many cards.
if (typeof window !== "undefined") setMaxDpr(1);

type MediaRevealProps = {
  className?: string;
  image?: string;
  video?: string;
  iframe?: { src: string; title: string };
};

// An img-fx "generation" shader acts as the loading skeleton and dissolves away
// to reveal the media underneath once it is ready (image via img-fx's own
// reveal, video on first frame, iframe on load). With no media it is just the
// animated skeleton. The shader and video only initialise once the element
// nears the viewport so a long grid/feed doesn't spin up dozens of WebGL
// contexts on first paint.
export const MediaReveal = ({ className, image, video, iframe }: MediaRevealProps) => {
  const handle = useRef<ImageGenerationHandle>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Fall back to the skeleton when the source changes or is removed.
  useEffect(() => {
    setRevealed(false);
  }, [image, video, iframe?.src]);

  useEffect(() => {
    if (!image || !inView) return;
    handle.current?.triggerReveal({ hold: "manual" });
  }, [image, inView]);

  // Catch videos that were already buffered (e.g. cached) before the event
  // listeners attached and so never fire loadeddata/canplay.
  useEffect(() => {
    if (!video || !inView) return;
    const el = videoRef.current;
    if (el && el.readyState >= 2) setRevealed(true);
  }, [video, inView]);

  const fadeOut = revealed && (Boolean(video) || Boolean(iframe));

  return (
    <div ref={rootRef} className={cn("bg-muted relative overflow-hidden", className)}>
      {video && inView && (
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
      {iframe && (
        <iframe
          className="absolute inset-0 h-full w-full bg-background"
          title={iframe.title}
          src={iframe.src}
          onLoad={() => setRevealed(true)}
        />
      )}
      {inView && (
        <ImageGeneration
          ref={handle}
          className="pointer-events-none absolute! inset-0 transition-opacity duration-700"
          style={{ opacity: fadeOut ? 0 : 1 }}
          preset="pixels-organic"
          theme="auto"
          images={image}
          paused={fadeOut}
        >
          <div style={{ width: "100%", height: "100%" }} />
        </ImageGeneration>
      )}
    </div>
  );
};
