import { Footer } from "./_components/footer";
import { Header } from "./_components/header";

import "./preview.css";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@repo/ui/utils";
import {
  ApertureIcon,
  AppWindowIcon,
  BracesIcon,
  CheckIcon,
  ClipboardCheckIcon,
  DatabaseIcon,
  EyeIcon,
  FileSpreadsheetIcon,
  GithubIcon,
  GlobeIcon,
  KeyIcon,
  LockIcon,
  SearchIcon,
  TerminalSquareIcon,
  UploadIcon,
  UserIcon,
  XIcon,
} from "lucide-react";
import { motion } from "motion/react";

import { GridPattern } from "./_components/grid-pattern";
import { HeroExample } from "./_components/hero-example";
import { HighlightCard } from "./_components/highlight-card";
import { InfiniteLooper } from "./_components/infinite-loop";
import { Logo } from "./_components/logo";

const hightlightedTransform = {
  0: 0,
  1: -100,
  2: -170,
};

const Preview = () => {
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
    <div className="font-sans antialiased">
      <Header />
      <main className="contained-page text-center">
        <HeroPattern />
        <section className="px-5 pt-[70px] sm:pt-[100px]">
          <h1 className="mx-auto mt-3 max-w-xl text-3xl font-semibold sm:text-4xl">
            <span className="block bg-gradient-to-b from-emerald-300 to-green-600 bg-clip-text text-transparent">
              Generate software products
            </span>
            <span>on your organization data</span>
          </h1>
          <p className="mx-auto mt-6 max-w-md text-base whitespace-pre-line text-zinc-400">
            Everyone on your team should be able to build software to automate
            their own day to day workflows
          </p>
          <div className="mt-8 grid items-start justify-center gap-4">
            <a className="group relative text-xs" href="">
              <div className="animate-tilt absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 opacity-75 blur transition group-hover:opacity-100" />
              <div className="relative flex items-center rounded-full bg-black bg-gradient-to-t from-zinc-900 px-7 py-2.5 text-emerald-400 transition group-hover:text-zinc-100">
                Start Building &rarr;
              </div>
            </a>
            <span className="text-muted-foreground text-sm">See samples</span>
          </div>
        </section>
        <div className="full-bleed relative">
          <video
            preload="metadata"
            loop
            autoPlay
            muted
            playsInline
            className="pointer-events-none absolute inset-0 w-full translate-y-10 [mask-image:linear-gradient(transparent_10%,black,transparent)] opacity-50 mix-blend-lighten hue-rotate-[250deg]"
          >
            <source src="https://zmdrwswxugswzmcokvff.supabase.co/storage/v1/object/public/uicapsule/emerald-template/home-hero-bg.mov" />
          </video>
          <HeroExample />
        </div>
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
          <div className="mt-8 flex flex-col gap-8 lg:flex-row">
            <HomeCard
              title="Prebuilt templates"
              description={
                <HomeCardDescriptionList
                  points={[
                    "Created by top operators",
                    "Customize them to fit your needs",
                    "Share them with your team",
                  ]}
                />
              }
              inline
            >
              <div className="relative h-80 w-full rounded-2xl border border-dashed border-zinc-700">
                <SearchIcon className="absolute top-4 left-6 h-4 w-4 text-zinc-700" />
                <XIcon className="absolute top-4 right-6 h-4 w-4 text-zinc-700" />
                <p className="absolute top-[14px] left-12 text-sm text-zinc-700">
                  Build a churn analysis dashboard
                </p>
                <div className="absolute inset-x-4 inset-y-0 z-10 border-x border-dashed border-zinc-700" />
                <div className="absolute inset-x-0 top-0 h-12 border-b border-dashed border-zinc-700" />
                <div className="absolute inset-x-0 bottom-0 z-0 flex h-10 flex-row items-center gap-2 overflow-hidden border-t border-dashed border-zinc-700 px-6 text-xs text-zinc-700">
                  <div className="rounded-md border border-dashed border-zinc-700 px-2 py-1 whitespace-nowrap">
                    Reference 1
                  </div>
                  <div className="rounded-md border border-dashed border-zinc-700 px-2 py-1 whitespace-nowrap">
                    Reference 2
                  </div>
                </div>
                <div className="absolute inset-x-8 inset-y-16 flex animate-pulse flex-col gap-4">
                  <div className="h-2 w-4/5 rounded bg-zinc-700" />
                  <div className="h-2 w-2/3 rounded bg-zinc-700" />
                  <div className="h-2 w-1/3 rounded bg-zinc-700" />
                  <div className="h-2 w-1/2 rounded bg-zinc-700" />
                </div>
              </div>
            </HomeCard>
            <HomeCard
              className="overflow-hidden text-xs"
              title="Private and secure by default"
              description={
                <HomeCardDescriptionList
                  points={[
                    "Built in permission and access control",
                    "End to end encryption",
                    "BYO database, model, or interface",
                  ]}
                />
              }
              pattern={
                <div className="pointer-events-none absolute top-0 left-0 w-full bg-gradient-to-b from-transparent to-zinc-800 bg-clip-text font-mono text-xs leading-4 tracking-[4px] break-all text-transparent">
                  0000101001010011011001010110001101110101011100100110100101110100011110010010000001100001011011100110010000100000010100000111001001101001011101100110000101100011011110010000101001010000011100100110100101110110011000010110001101111001001000000110000101101110011001000010000001110011011001010110001101110101011100100110100101110100011110010010000001100001011100100110010100100000011101000110111101101111001000000110100101101101011100000110111101110010011101000110000101101110011101000010000001100110011011110111001000100000011011000110010101100111011000010110110001100101011100110110010100100000010000110110110001100001011110010010000001100100011011110110010101110011001000000110111001101111011101000010000000001010010100110110010101100011011101010111001001101001011101000111100100100000011000010110111001100100001000000101000001110010011010010111011001100001011000110111100100001010010100000111001001101001011101100110000101100011011110010010000001100001011011100110010000100000011100110110010101100011011101010111001001101001011101000111100100100000011000010111001001100101001000000111010001101111011011110010000001101001011011010111000001101111011100100111010001100001011011100111010000100000011001100110111101110010001000000110110001100101011001110110000101101100011001010111001101100101001000000100001101101100011000010111100100100000011001000110111101100101011100110010000001101110011011110111010000100000000010100101001101100101011000110111010101110010011010010111010001111001001000000110000101101110011001000010000001010000011100100110100101110110011000010110001101111001000010100101000001110010011010010111011001100001011000110111100100100000011000010110111001100110111101110010001000000110110001100101011001110110000101101100011001010111001101100101001000000100001101101100011000010111100100100000011001000110111101100101011100110010000001101110011011110111010000100000000010100101001101100101011000110111010101110010011010010111010001111001001000000110000101101110011001000010000001010000011100100110100101110110011000010110001101111001000010100101000001110010011010010111011001100001011000110111100100100000011000010110110100110100101110110011000010110001101111001001000000110000101101101001101001011101100110000101100011011110010010000001100001011011
                </div>
              }
              inline
            >
              <div className="mt-10 grid w-full grid-cols-3 gap-5">
                <div className="flex flex-col items-center">
                  <SourceIcon className="rounded" Icon={KeyIcon} />
                  Secure
                </div>
                <div className="flex flex-col items-center">
                  <SourceIcon className="rounded" Icon={LockIcon} />
                  Encrypted
                </div>
                <div className="flex flex-col items-center">
                  <SourceIcon className="rounded" Icon={ClipboardCheckIcon} />
                  Compliant
                </div>
                <div className="flex flex-col items-center">
                  <SourceIcon className="rounded" Icon={UserIcon} />
                  Access Control
                </div>
                <div className="flex flex-col items-center">
                  <SourceIcon className="rounded" Icon={EyeIcon} />
                  Observable
                </div>
                <div className="flex flex-col items-center">
                  <SourceIcon className="rounded" Icon={TerminalSquareIcon} />
                  Scriptable
                </div>
              </div>
            </HomeCard>
          </div>
          <HomeCard
            className="mt-8 lg:pl-10"
            title="We'll go where you go"
            description={
              <HomeCardDescriptionList
                points={[
                  "Direct data integrations with the tools you already use",
                  "Multi-platform to work where you work",
                ]}
              />
            }
          >
            <div className="w-full overflow-hidden">
              <h3 className="text-center text-xs">Things people have asked:</h3>
              <InfiniteLooper containerClassName="mt-3">
                <QuestionCard>When does the next fundraise start?</QuestionCard>
                <QuestionCard>Whats the latest on the Block deal?</QuestionCard>
                <QuestionCard>
                  Who is managing design system project?
                </QuestionCard>
              </InfiniteLooper>
              <InfiniteLooper
                containerClassName="mt-3"
                speed={120}
                direction="left"
              >
                <QuestionCard>
                  Can you summarize the last all hands?
                </QuestionCard>
                <QuestionCard>Whats does the Grow team do?</QuestionCard>
                <QuestionCard>
                  Can you provide a changelog of everything shipped in TC this
                  week?
                </QuestionCard>
                <QuestionCard>
                  Whats our HR policy on working from home?
                </QuestionCard>
              </InfiniteLooper>
              <InfiniteLooper containerClassName="mt-3" speed={30}>
                <QuestionCard>
                  Who do I contact to get Airtable access?
                </QuestionCard>
                <QuestionCard>
                  Who is responsible for the design of the landing experience?
                </QuestionCard>
              </InfiniteLooper>
            </div>
          </HomeCard>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Preview;

const HeroPattern = () => {
  return (
    <div className="absolute inset-0 -z-10 [mask-image:linear-gradient(white,transparent_75%)]">
      <GridPattern
        width={72}
        height={56}
        x="-12"
        y="4"
        squares={[
          [4, 3],
          [2, 1],
          [7, 3],
          [10, 6],
        ]}
        className="h-full w-full fill-white/[0.025] stroke-white/5 mix-blend-overlay"
      />
    </div>
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

const HomeCardDescriptionList = ({ points }: { points: React.ReactNode[] }) => (
  <ul className="flex flex-col gap-1">
    {points.map((point, index) => (
      <li className="flex items-start gap-2.5" key={index}>
        <CheckIcon className="mt-1.5 h-4 w-4 flex-none text-green-500" />
        {point}
      </li>
    ))}
  </ul>
);

const QuestionCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="mr-3 rounded border border-dashed border-zinc-700 bg-zinc-900 p-3 text-xs text-white">
      {children}
    </div>
  );
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
