import type { ReactNode } from "react";

import { HomeCard, HomeCardDescriptionList } from "./home-card";
import { InfiniteLooper } from "./infinite-loop";

const QuestionCard = ({ children }: { children: ReactNode }) => (
  <div className="mr-3 rounded border border-dashed border-zinc-700 bg-zinc-900 p-3 text-xs text-white">
    {children}
  </div>
);

const MARQUEE_SECONDS = [70, 120, 30] as const;

export const IntegrationsSection = ({ marqueeSpeed }: { marqueeSpeed: number }) => (
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
      <InfiniteLooper containerClassName="mt-3" speed={MARQUEE_SECONDS[0] / marqueeSpeed}>
        <QuestionCard>When does the next fundraise start?</QuestionCard>
        <QuestionCard>Whats the latest on the Block deal?</QuestionCard>
        <QuestionCard>Who is managing design system project?</QuestionCard>
      </InfiniteLooper>
      <InfiniteLooper
        containerClassName="mt-3"
        speed={MARQUEE_SECONDS[1] / marqueeSpeed}
        direction="left"
      >
        <QuestionCard>Can you summarize the last all hands?</QuestionCard>
        <QuestionCard>Whats does the Grow team do?</QuestionCard>
        <QuestionCard>
          Can you provide a changelog of everything shipped in TC this week?
        </QuestionCard>
        <QuestionCard>Whats our HR policy on working from home?</QuestionCard>
      </InfiniteLooper>
      <InfiniteLooper containerClassName="mt-3" speed={MARQUEE_SECONDS[2] / marqueeSpeed}>
        <QuestionCard>Who do I contact to get Airtable access?</QuestionCard>
        <QuestionCard>Who is responsible for the design of the landing experience?</QuestionCard>
      </InfiniteLooper>
    </div>
  </HomeCard>
);
