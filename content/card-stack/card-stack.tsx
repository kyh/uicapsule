import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

type CardStackProps = {
  cards: { src: string; href: string; alt: string }[];
};

/** Wheel delta (px) required to advance the stack by one timeline second. */
const WHEEL_PIXELS_PER_SECOND = 1000;
/** Max tilt (deg) applied across the full height/width of the viewport. */
const TILT_X_RANGE = 5;
const TILT_Y_RANGE = 10;

export const CardStack = ({ cards }: CardStackProps) => {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    let incr = 0;

    const root = rootRef.current;
    if (!root) {
      return;
    }

    const slides = root.querySelectorAll(".slide");
    const slideContent = root.querySelectorAll(".content");

    if (slides.length === 0) {
      return;
    }

    const deltaObject = { delta: 0 };

    const baseDuration = slides.length / 2;
    const staggerEach = 0.5;
    const repeatDelay = baseDuration - staggerEach;

    const deltaTo = gsap.quickTo(deltaObject, "delta", {
      duration: 0.8,
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

    const tl = gsap.timeline({ paused: true, smoothChildTiming: true });
    tl.fromTo(
      slides,
      {
        y: "-15vw",
        z: "-60vw",
        force3D: true,
      },
      {
        y: "0vw",
        z: "0vw",
        ease: "none",
        force3D: true,
        immediateRender: false,
        duration: baseDuration,
        stagger: {
          each: staggerEach,
          repeat: -1,
          repeatDelay: 0,
        },
      },
    );

    tl.fromTo(
      slideContent,
      {
        y: "10vh",
      },
      {
        y: 0,
        ease: "back.out(1.05)",
        duration: staggerEach,
        stagger: {
          each: staggerEach,
          repeat: -1,
          repeatDelay: repeatDelay,
          onRepeat(this: gsap.core.Tween) {
            const [target] = this.targets();
            if (target instanceof HTMLElement) {
              target.style.transform = "translateY(100vh)";
            }
          },
        },
      },
      "<",
    );

    tl.fromTo(
      slideContent,
      {
        y: 0,
      },
      {
        y: "200vh",
        ease: "power3.in",
        duration: staggerEach,
        delay: repeatDelay,
        stagger: {
          each: staggerEach,
          repeat: -1,
          repeatDelay: repeatDelay,
          onRepeat(this: gsap.core.Tween) {
            const [target] = this.targets();
            if (target instanceof HTMLElement) {
              target.style.transform = "translateY(0vh)";
            }
          },
        },
      },
      "<",
    );

    const beginDistance = slides.length * 100;

    tl.totalTime(beginDistance);

    deltaTo(beginDistance + 0.01, beginDistance);

    const snap = gsap.utils.snap(baseDuration / slides.length);

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      incr -= e.deltaY / WHEEL_PIXELS_PER_SECOND;
      deltaTo(snap(incr + beginDistance));
    };

    const handleMouseMove = (e: MouseEvent) => {
      const valX = (e.clientY / window.innerHeight - 0.5) * TILT_X_RANGE;
      const valY = (e.clientX / window.innerWidth - 0.5) * TILT_Y_RANGE;
      rotX(-valX);
      rotY(valY);
    };

    root.addEventListener("wheel", handleWheel, { passive: false });
    root.addEventListener("mousemove", handleMouseMove);

    return () => {
      root.removeEventListener("wheel", handleWheel);
      root.removeEventListener("mousemove", handleMouseMove);
    };
  });

  return (
    <section className="effect h-screen overflow-hidden bg-[#121212] text-[#f1f1f1] [perspective:150vw]">
      <div className="root h-full [transform-style:preserve-3d]" ref={rootRef}>
        {cards.map((card) => (
          <a
            key={card.src}
            className="slide absolute top-[calc(50%-5vw)] left-[calc(50%-20vw)] block [aspect-ratio:1.75] w-[40vw]"
            href={card.href}
            target="_blank"
          >
            <img
              alt={card.alt}
              className="content h-full w-full rounded-[12px] object-cover"
              src={card.src}
            />
          </a>
        ))}
      </div>
    </section>
  );
};
