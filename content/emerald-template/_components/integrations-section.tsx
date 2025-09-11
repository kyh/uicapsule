import React from "react";
import { cn } from "@repo/ui/utils";

import { HighlightCard } from "./highlight-card";
import { InfiniteLooper } from "./infinite-loop";

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
        <svg
          className="mt-1.5 h-4 w-4 flex-none text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
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

export const IntegrationsSection = () => {
  return (
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
          <QuestionCard>Who is managing design system project?</QuestionCard>
        </InfiniteLooper>
        <InfiniteLooper containerClassName="mt-3" speed={120} direction="left">
          <QuestionCard>Can you summarize the last all hands?</QuestionCard>
          <QuestionCard>Whats does the Grow team do?</QuestionCard>
          <QuestionCard>
            Can you provide a changelog of everything shipped in TC this week?
          </QuestionCard>
          <QuestionCard>Whats our HR policy on working from home?</QuestionCard>
        </InfiniteLooper>
        <InfiniteLooper containerClassName="mt-3" speed={30}>
          <QuestionCard>Who do I contact to get Airtable access?</QuestionCard>
          <QuestionCard>
            Who is responsible for the design of the landing experience?
          </QuestionCard>
        </InfiniteLooper>
      </div>
    </HomeCard>
  );
};
