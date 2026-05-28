"use client";

import { useEffect, useRef, useState } from "react";
import { ImageGeneration, setMaxDpr, type ImageGenerationHandle } from "img-fx";
import { cn } from "@repo/ui/lib/utils";

// The shaders are a decorative loading effect, so render them at DPR 1 — the
// extra fragment cost of retina resolution isn't worth it across many cards.
if (typeof window !== "undefined") setMaxDpr(1);

// Latches true once the element first scrolls near the viewport, so the heavy
// work (WebGL shader, video loading) is deferred until then.
const useInView = (rootMargin = "200px") => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
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
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView] as const;
};

type MediaRevealProps = {
  className?: string;
  image?: string;
  video?: string;
  iframe?: { src: string; title: string };
};

// An img-fx "generation" shader acts as the loading skeleton and dissolves away
// to reveal the media underneath once it is ready (image via img-fx's own
// reveal, video on first frame, iframe on load), then drops from the DOM to
// free its WebGL instance. With no media it is just the animated skeleton.
export const MediaReveal = ({ className, image, video, iframe }: MediaRevealProps) => {
  const handle = useRef<ImageGenerationHandle>(null);
  const [rootRef, inView] = useInView();
  const [revealed, setRevealed] = useState(false);
  const [retired, setRetired] = useState(false);

  // Reset to the skeleton when the source changes or is removed (e.g. a feed
  // item scrolled away and back) — derived during render, no Effect needed.
  const source = iframe?.src ?? video ?? image ?? null;
  const [prevSource, setPrevSource] = useState(source);
  if (source !== prevSource) {
    setPrevSource(source);
    setRevealed(false);
    setRetired(false);
  }

  // Reveal an image once the shader is mounted; img-fx loads the bitmap itself.
  useEffect(() => {
    if (image && inView) handle.current?.triggerReveal({ hold: "manual" });
  }, [image, inView]);

  const fadeOut = revealed && (Boolean(video) || Boolean(iframe));

  return (
    <div ref={rootRef} className={cn("bg-muted relative overflow-hidden", className)}>
      {video && inView && (
        <video
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
      {inView && !retired && (
        <ImageGeneration
          ref={handle}
          className="pointer-events-none absolute! inset-0 transition-opacity duration-700"
          style={{ opacity: fadeOut ? 0 : 1 }}
          preset="pixels-organic"
          theme="auto"
          images={image}
          paused={fadeOut}
          onTransitionEnd={(e) => {
            if (e.propertyName === "opacity" && fadeOut) setRetired(true);
          }}
        >
          <div style={{ width: "100%", height: "100%" }} />
        </ImageGeneration>
      )}
    </div>
  );
};
