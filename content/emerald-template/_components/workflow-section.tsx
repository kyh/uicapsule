import React, { useEffect, useRef, useState } from "react";
import { cn } from "@repo/ui/utils";
import {
  ApertureIcon,
  AppWindowIcon,
  BracesIcon,
  DatabaseIcon,
  FileSpreadsheetIcon,
  GithubIcon,
  GlobeIcon,
  UploadIcon,
} from "lucide-react";
import { motion } from "motion/react";

import { HighlightCard } from "./highlight-card";
import { Logo } from "./logo";

const hightlightedTransform = {
  0: 0,
  1: -100,
  2: -170,
};

const SourceIcon = ({
  Icon,
  id,
  className,
}: {
  Icon?: React.JSXElementConstructor<any>;
  id?: string;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "inline-flex justify-center rounded-full border border-dashed border-zinc-700 bg-zinc-900 p-3 text-white",
        className,
      )}
    >
      {Icon && <Icon className="size-5" />}
      {id && (
        <img
          alt={id}
          width={20}
          height={20}
          className="size-5"
          src={`https://zmdrwswxugswzmcokvff.supabase.co/storage/v1/object/public/uicapsule/emerald-template/${id}.svg`}
        />
      )}
    </div>
  );
};

const Lines = ({
  className,
  width,
  height,
  radius,
  strokeWidth,
  highlightStrokeWidth,
  strokeDasharray,
  invert,
}: {
  className?: string;
  width: number;
  height: number;
  radius: number;
  strokeWidth: number;
  highlightStrokeWidth: number;
  strokeDasharray: number;
  invert?: boolean;
}) => {
  const topLinesHeight = Math.round(height / 3);
  const bottomLineHeight = height - topLinesHeight;
  const thirdWidth = Math.round(width / 3);
  const halfWidth = Math.round(width / 2);
  const sixthWidth = Math.round(width / 6);

  const path = `M1 0v${
    topLinesHeight - radius
  }a${radius} ${radius} 0 00${radius} ${radius}h${halfWidth - radius}M${
    width - 1
  } 0v${topLinesHeight - radius}a${radius} ${radius} 0 01-${radius} ${radius}H${
    halfWidth + 1
  }v${bottomLineHeight}m-${sixthWidth} -${height}v${topLinesHeight}m${thirdWidth} -${topLinesHeight}v${topLinesHeight}`;

  const animate = invert
    ? {
        x1: [0, 0],
        y1: [2.5 * height, -2 * height],
        x2: [0, 0],
        y2: [2 * height, -2.5 * height],
      }
    : {
        x1: [0, 0],
        y1: [-2.5 * height, 2 * height],
        x2: [0, 0],
        y2: [-2 * height, 2.5 * height],
      };

  const animateId = `pulse-${invert ? "inverted" : "normal"}`;

  return (
    <svg
      className={cn(invert && "rotate-180", className)}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
    >
      <path
        d={path}
        stroke="#ffffff20"
        strokeDasharray={strokeDasharray}
        strokeWidth={strokeWidth}
      />
      <path
        d={path}
        stroke={`url(#${animateId})`}
        strokeLinecap="round"
        strokeWidth={highlightStrokeWidth}
        strokeDasharray={strokeDasharray}
      />
      <defs>
        <motion.linearGradient
          animate={animate}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
          id={animateId}
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={"oklch(0.696 0.17 162.48)"} stopOpacity="0" />
          <stop stopColor={"oklch(0.696 0.17 162.48)"} stopOpacity="0.4" />
          <stop
            offset="1"
            stopColor={"oklch(0.696 0.17 162.48)"}
            stopOpacity="0"
          />
        </motion.linearGradient>
      </defs>
    </svg>
  );
};

const HomeCard = ({
  className,
  title,
  description,
  inline,
  pattern,
  children,
}: {
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  inline?: boolean;
  pattern?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  return (
    <HighlightCard
      // size="lg"
      className={cn("grow", className)}
      pattern={pattern}
      gridProps={{
        y: -6,
        squares: [
          [-1, 2],
          [1, 3],
        ],
      }}
    >
      <div
        className={cn(
          "flex h-full items-center gap-5 text-center lg:gap-8 lg:text-start",
          inline ? "flex-col" : "flex-col lg:flex-row",
        )}
      >
        <div className="flex min-w-[300px] shrink-0 flex-col gap-2 lg:gap-5">
          <h3 className="text-xl font-semibold sm:text-2xl">{title}</h3>
          <div className="text-start text-sm text-zinc-300 sm:text-base">
            {description}
          </div>
        </div>
        {children}
      </div>
    </HighlightCard>
  );
};

export const WorkflowSection = () => {
  const [highlighted, setHighlighted] = useState(0);
  const sourcesContainerRef = useRef<HTMLDivElement>(null);
  const [sourcesContainerDimensions, setSourcesContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (!sourcesContainerRef.current) {
        return;
      }

      const sourcesContainerRect =
        sourcesContainerRef.current?.getBoundingClientRect();

      const width = sourcesContainerRect?.width || 0;
      const height = sourcesContainerRect?.height || 0;

      setSourcesContainerDimensions({
        width,
        height,
      });
    });

    sourcesContainerRef.current &&
      observer.observe(sourcesContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <section className="px-5 pt-20 sm:pt-24">
      <h2 className="mx-auto mt-3 max-w-xl text-3xl font-semibold sm:text-4xl">
        Simple prompt based workflow
      </h2>
      <HomeCard
        className="mt-14 lg:pl-10"
        title="Plug 'n Play"
        description={
          <ol className="ml-5 flex list-decimal flex-col gap-1">
            {[
              "Connect your data source",
              "Build your app",
              "One click deploy",
            ].map((item, index) => {
              return (
                <li
                  className="relative leading-9"
                  onMouseEnter={() => setHighlighted(index)}
                  key={item}
                >
                  {highlighted === index && (
                    <motion.div
                      layoutId="about-card-active"
                      className="pointer-events-none absolute top-0 -left-7 h-full w-full rounded bg-black/50"
                    />
                  )}
                  <span className="relative">{item}</span>
                </li>
              );
            })}
          </ol>
        }
      >
        <div className="flex grow items-center justify-center overflow-hidden">
          <div
            className="max-h-[254px] transition duration-500 ease-in-out"
            style={{
              transform: `translateY(${
                hightlightedTransform[
                  highlighted as keyof typeof hightlightedTransform
                ]
              }px)`,
            }}
          >
            <div className="grid grid-cols-4 items-center justify-center gap-4">
              <SourceIcon Icon={DatabaseIcon} />
              <SourceIcon Icon={FileSpreadsheetIcon} />
              <SourceIcon id="drive" />
              <SourceIcon id="linear" />
              <SourceIcon Icon={GlobeIcon} />
              <SourceIcon Icon={GithubIcon} />
              <SourceIcon id="markdown" />
              <SourceIcon Icon={UploadIcon} />
            </div>
            <div className="w-full px-5">
              <div ref={sourcesContainerRef}>
                <Lines
                  width={sourcesContainerDimensions.width}
                  height={100}
                  radius={5}
                  strokeWidth={1}
                  highlightStrokeWidth={2}
                  strokeDasharray={2}
                />
              </div>
              <div className="flex justify-center">
                <div className="shadow-highlight rounded-full p-3 text-white">
                  <Logo className="size-5" />
                </div>
              </div>
              <Lines
                width={sourcesContainerDimensions.width}
                height={100}
                radius={5}
                strokeWidth={1}
                highlightStrokeWidth={2}
                strokeDasharray={2}
                invert
              />
            </div>
            <div className="grid grid-cols-4 items-center justify-center gap-4">
              <SourceIcon Icon={AppWindowIcon} />
              <SourceIcon Icon={BracesIcon} />
              <SourceIcon id="slack" />
              <SourceIcon Icon={ApertureIcon} />
            </div>
          </div>
        </div>
      </HomeCard>
    </section>
  );
};
