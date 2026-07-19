import { type ReactNode } from "react";

import { HomeCard, HomeCardDescriptionList } from "./home-card";
import { InfiniteLooper } from "./infinite-loop";

const QuestionCard = ({ children }: { children: ReactNode }) => {
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
          <QuestionCard>Who is responsible for the design of the landing experience?</QuestionCard>
        </InfiniteLooper>
      </div>
    </HomeCard>
  );
};
