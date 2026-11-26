import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

const noop = () => null;

interface CardStackProps {
  cards: { src: string; href: string; alt: string }[];
  /** Card width as a percentage of the viewport width. */
  cardWidth?: number;
  aspectRatio?: number;
  /** Card corner radius in pixels. */
  radius?: number;
  /** How far back the stack recedes, in vw. */
  depth?: number;
  /** How far above the front card the back of the stack rises, in vw. */
  rise?: number;
  /** CSS perspective distance in vw. */
  perspective?: number;
  /** Maximum cursor tilt around the vertical axis, in degrees; the horizontal axis gets half. */
  tilt?: number;
  /** Wheel distance multiplier. */
  scrollSpeed?: number;
  /** Seconds the stack takes to settle after a scroll. */
  smoothing?: number;
  /** Seconds between automatic advances; 0 turns autoplay off. */
  autoplayInterval?: number;
  background?: string;
}

const WHEEL_PIXELS_PER_SECOND = 1000;
const ENTER_OFFSET_VH = 10;

const setContentTransformOnRepeat = (transform: string) =>
  function onRepeat(this: gsap.core.Tween) {
    const [target] = this.targets();

    if (target instanceof HTMLElement) {
      target.style.transform = transform;
    }
  };

export const CardStack = ({
  cards,
  cardWidth = 40,
  aspectRatio = 1.75,
  radius = 12,
  depth = 60,
  rise = 15,
  perspective = 150,
  tilt = 10,
  scrollSpeed = 1,
  smoothing = 0.8,
  autoplayInterval = 0,
  background = "#121212",
}: CardStackProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const cardKey = cards.map((card) => card.src).join("|");

  useGSAP(
    () => {
      let incr = 0;

      const root = rootRef.current;

      if (!root) {
        return noop;
      }

      const slides = root.querySelectorAll(".slide");
      const slideContent = root.querySelectorAll(".content");

      if (slides.length === 0) {
        return noop;
      }

      const deltaObject = { delta: 0 };

      const baseDuration = slides.length / 2;
      const staggerEach = 0.5;
      const repeatDelay = baseDuration - staggerEach;

      const tl = gsap.timeline({ paused: true, smoothChildTiming: true });

      const deltaTo = gsap.quickTo(deltaObject, "delta", {
        duration: smoothing,
        ease: "power1",
        onUpdate: () => {
          tl.totalTime(deltaObject.delta);
        },
      });

      const rotY = gsap.quickTo(root, "rotationY", {
        duration: 0.3,
        ease: "power3",
      });

      const rotX = gsap.quickTo(root, "rotationX", {
        duration: 0.3,
        ease: "power3",
      });

      tl.fromTo(
        slides,
        {
          force3D: true,
          y: `${-rise}vw`,
          z: `${-depth}vw`,
        },
        {
          duration: baseDuration,
          ease: "none",
          force3D: true,
          immediateRender: false,
          stagger: {
            each: staggerEach,
            repeat: -1,
            repeatDelay: 0,
          },
          y: "0vw",
          z: "0vw",
        },
      );

      tl.fromTo(
        slideContent,
        {
          clipPath: `inset(0vh 0vh ${ENTER_OFFSET_VH}vh 0vh)`,
          y: `${ENTER_OFFSET_VH}vh`,
        },
        {
          clipPath: "inset(0vh 0vh 0vh 0vh)",
          duration: staggerEach,
          ease: "back.out(1.05)",
          stagger: {
            each: staggerEach,
            onRepeat: setContentTransformOnRepeat("translateY(100vh)"),
            repeat: -1,
            repeatDelay,
          },
          y: 0,
        },
        "<",
      );

      tl.fromTo(
        slideContent,
        {
          y: 0,
        },
        {
          delay: repeatDelay,
          duration: staggerEach,
          ease: "power3.in",
          stagger: {
            each: staggerEach,
            onRepeat: setContentTransformOnRepeat("translateY(0vh)"),
            repeat: -1,
            repeatDelay,
          },
          y: "200vh",
        },
        "<",
      );

      const beginDistance = slides.length * 100;

      tl.totalTime(beginDistance);

      deltaTo(beginDistance + 0.01, beginDistance);

      const snap = gsap.utils.snap(baseDuration / slides.length);

      const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        incr -= (e.deltaY / WHEEL_PIXELS_PER_SECOND) * scrollSpeed;
        deltaTo(snap(incr + beginDistance));
      };

      const autoplay =
        autoplayInterval > 0
          ? window.setInterval(() => {
              incr -= staggerEach;
              deltaTo(snap(incr + beginDistance));
            }, autoplayInterval * 1000)
          : 0;

      const handleMouseMove = (e: MouseEvent) => {
        const valX = (e.clientY / window.innerHeight - 0.5) * (tilt / 2);
        const valY = (e.clientX / window.innerWidth - 0.5) * tilt;
        rotX(-valX);
        rotY(valY);
      };

      root.addEventListener("wheel", handleWheel, { passive: false });
      root.addEventListener("mousemove", handleMouseMove);

      return () => {
        window.clearInterval(autoplay);
        root.removeEventListener("wheel", handleWheel);
        root.removeEventListener("mousemove", handleMouseMove);
      };
    },
    {
      dependencies: [cardKey, depth, rise, tilt, scrollSpeed, smoothing, autoplayInterval],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      className="effect h-screen overflow-hidden text-[#f1f1f1]"
      style={{ backgroundColor: background, perspective: `${perspective}vw` }}
    >
      <div className="root h-full [transform-style:preserve-3d]" ref={rootRef}>
        {cards.map((card) => (
          <a
            key={card.src}
            className="slide absolute block"
            href={card.href}
            style={{
              aspectRatio,
              left: `calc(50% - ${cardWidth / 2}vw)`,
              top: `calc(50% - ${cardWidth / 8}vw)`,
              width: `${cardWidth}vw`,
            }}
            target="_blank"
          >
            <img
              alt={card.alt}
              className="content h-full w-full object-cover"
              src={card.src}
              style={{ borderRadius: radius }}
            />
          </a>
        ))}
      </div>
    </section>
  );
};
