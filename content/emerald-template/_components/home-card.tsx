import { type ReactNode } from "react";
import { cn } from "@repo/ui/lib/utils";

import { HighlightCard } from "./highlight-card";

const cardGridProps = {
  y: -6,
  squares: [
    [-1, 2],
    [1, 3],
  ],
};

export const HomeCard = ({
  className,
  title,
  description,
  inline,
  pattern,
  children,
}: {
  className?: string;
  title?: ReactNode;
  description?: ReactNode;
  inline?: boolean;
  pattern?: ReactNode;
  children?: ReactNode;
}) => {
  return (
    <HighlightCard className={cn("grow", className)} pattern={pattern} gridProps={cardGridProps}>
      <div
        className={cn(
          "flex h-full items-center gap-5 text-center lg:gap-8 lg:text-start",
          inline ? "flex-col" : "flex-col lg:flex-row",
        )}
      >
        <div className="flex min-w-[300px] shrink-0 flex-col gap-2 lg:gap-5">
          <h3 className="text-xl font-semibold sm:text-2xl">{title}</h3>
          <div className="text-start text-sm text-zinc-300 sm:text-base">{description}</div>
        </div>
        {children}
      </div>
    </HighlightCard>
  );
};

export const HomeCardDescriptionList = ({ points }: { points: string[] }) => (
  <ul className="flex flex-col gap-1">
    {points.map((point) => (
      <li className="flex items-start gap-2.5" key={point}>
        <svg
          className="mt-1.5 h-4 w-4 flex-none text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {point}
      </li>
    ))}
  </ul>
);
