"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { cn } from "@repo/ui/lib/utils";

// Latches true once the element first scrolls near the viewport, so the heavy
// work (media loading) is deferred until then.
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

// A shimmering skeleton covers the frame and wipes away once the media beneath
// it is ready (image/video on first frame, iframe on load), then drops from the
// DOM. With no media it is just the skeleton, shimmering indefinitely.
export const MediaReveal = ({ className, image, video, iframe }: MediaRevealProps) => {
  const [rootRef, inView] = useInView();
  const [revealed, setRevealed] = useState(false);
  const [retired, setRetired] = useState(false);

  // At 100 the skeleton fully covers the frame; at -100 it has been wiped off
  // to the left, uncovering the media beneath.
  const wipe = useMotionValue(100);
  const maskImage = useTransform(
    wipe,
    (value) => `linear-gradient(to right, black ${value}%, transparent ${value + 100}%)`,
  );

  // Driven by hand rather than an `animate` prop so the sweep can be halted
  // mid-cycle: the skeleton freezes where it stands as the wipe takes it away,
  // the way a snapshotted outgoing layer would.
  const sweep = useMotionValue(-200);
  const backgroundPosition = useTransform(sweep, (value) => `${value}% 0`);

  useEffect(() => {
    if (revealed) return;
    sweep.set(-200);
    const controls = animate(sweep, 200, {
      duration: SHIMMER_DURATION,
      ease: "easeInOut",
      repeat: Infinity,
    });
    return () => controls.stop();
  }, [revealed, sweep]);

  useEffect(() => {
    if (!revealed) {
      wipe.set(100);
      return;
    }
    const controls = animate(wipe, -100, {
      duration: WIPE_DURATION,
      ease: "easeInOut",
      onComplete: () => setRetired(true),
    });
    return () => controls.stop();
  }, [revealed, wipe]);

  // When the iframe is unloaded and remounted (feed windowing), bring the
  // skeleton back so the reload doesn't flash an empty box.
  const [hasIframe, setHasIframe] = useState(Boolean(iframe));
  if (Boolean(iframe) !== hasIframe) {
    setHasIframe(Boolean(iframe));
    if (iframe && revealed) {
      setRevealed(false);
      setRetired(false);
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
          onLoad={() => setRevealed(true)}
        />
      )}
      {!retired && (
        <motion.div
          aria-hidden
          className="bg-muted pointer-events-none absolute inset-0"
          style={{ maskImage, WebkitMaskImage: maskImage }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: SHIMMER_GRADIENT,
              backgroundSize: "200% 100%",
              backgroundPosition,
            }}
          />
        </motion.div>
      )}
    </div>
  );
};
