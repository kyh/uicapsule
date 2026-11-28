import { useEffect, useRef } from "react";
import { cn } from "cn";

import { useInView } from "./use-in-view";
import { useReducedMotion } from "./use-reduced-motion";

import type { GalleryCover } from "./gallery-schema";

const play = async (video: HTMLVideoElement) => {
  try {
    await video.play();
  } catch (error) {
    if (!(error instanceof DOMException)) {
      throw error;
    }
  }
};

const CoverVideo = ({ poster, url }: { poster: string; url: string }) => {
  const { inView, ref } = useInView<HTMLDivElement>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playable = !useReducedMotion();

  useEffect(() => {
    const video = videoRef.current;

    if (video === null) {
      return;
    }

    if (inView) {
      void play(video);
    } else {
      video.pause();
    }
  }, [inView]);

  return (
    <div ref={ref} className="absolute inset-0">
      {playable ? (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          loop
          muted
          playsInline
          poster={poster}
          preload={inView ? "auto" : "none"}
          src={url}
        />
      ) : (
        <img alt="" className="h-full w-full object-cover" loading="lazy" src={poster} />
      )}
    </div>
  );
};

/** A component's cover, the gallery card's media: a looping trailer that plays only while on screen. */
export const CoverMedia = ({
  className,
  cover,
}: {
  className?: string;
  cover: GalleryCover | undefined;
}) => (
  <div className={cn("bg-muted relative aspect-video w-full overflow-hidden", className)}>
    {cover?.type === "video" && <CoverVideo poster={cover.poster} url={cover.url} />}
    {cover?.type === "image" && (
      <img
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        src={cover.url}
      />
    )}
  </div>
);
