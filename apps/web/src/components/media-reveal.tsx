"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { cn } from "@repo/ui/lib/utils";

// Latch visibility so loaded media stays mounted after scrolling away.
const useInView = (rootMargin = "200px") => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
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
  return { ref, inView };
};

const SHIMMER_DURATION = 1.5;
const WIPE_DURATION = 0.6;

const SHIMMER_HIGHLIGHT = "color-mix(in oklab, var(--color-foreground) 8%, transparent)";
const SHIMMER_GRADIENT = `linear-gradient(90deg, transparent 25%, ${SHIMMER_HIGHLIGHT} 50%, transparent 75%)`;

type MediaRevealProps = {
  className?: string;
  image?: string;
  video?: string;
  iframe?: { src: string; title: string };
};

export const MediaReveal = ({ className, image, video, iframe }: MediaRevealProps) => {
  const { ref: rootRef, inView } = useInView();
  const [revealed, setRevealed] = useState(false);
  const [wiped, setWiped] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const retired = wiped || (revealed && Boolean(prefersReducedMotion));

  // 100 covers the frame; -100 uncovers it.
  const wipe = useMotionValue(100);
  const maskImage = useTransform(
    wipe,
    (value) => `linear-gradient(to right, black ${value}%, transparent ${value + 100}%)`,
  );

  // A transform avoids repainting; manual controls freeze the shimmer during the wipe.
  const sweep = useMotionValue(-50);
  const sweepX = useTransform(sweep, (value) => `${value}%`);

  const shimmering = inView && !revealed && !prefersReducedMotion;

  useEffect(() => {
    if (!shimmering) return;
    sweep.set(-50);
    const controls = animate(sweep, 50, {
      duration: SHIMMER_DURATION,
      ease: "easeInOut",
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [shimmering, sweep]);

  useEffect(() => {
    if (!revealed) {
      wipe.set(100);
      return;
    }
    if (prefersReducedMotion) return;
    const controls = animate(wipe, -100, {
      duration: WIPE_DURATION,
      ease: "easeInOut",
      onComplete: () => setWiped(true),
    });
    return () => controls.stop();
  }, [revealed, wipe, prefersReducedMotion]);

  // Feed windowing remounts iframes; cover the frame while they reload.
  const [hasIframe, setHasIframe] = useState(Boolean(iframe));
  if (Boolean(iframe) !== hasIframe) {
    setHasIframe(Boolean(iframe));
    if (iframe && revealed) {
      setRevealed(false);
      setWiped(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("bg-muted relative overflow-hidden", className)}>
      {image && inView && (
        <Image
          className="absolute inset-0 h-full w-full object-cover"
          src={image}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, 50vw"
          onLoad={() => setRevealed(true)}
        />
      )}
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
          className="bg-background absolute inset-0 h-full w-full"
          title={iframe.title}
          src={iframe.src}
          allow="microphone; camera"
          onLoad={() => setRevealed(true)}
        />
      )}
      {!retired && (
        <motion.div
          aria-hidden
          className="bg-muted pointer-events-none absolute inset-0 overflow-hidden"
          style={{ maskImage, WebkitMaskImage: maskImage }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 w-[200%]"
            style={{ backgroundImage: SHIMMER_GRADIENT, x: sweepX }}
          />
        </motion.div>
      )}
    </div>
  );
};
