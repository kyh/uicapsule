import type { ReactNode } from "react";

import { cssVars } from "../lib/css";
import { formatClock } from "../lib/format";

interface CountdownProps {
  left: number;
  total: number;
  running: boolean;
  word: string;
  children?: ReactNode;
}

/** Time left as a clock and a ruler of whole minutes that go out one by one, left to right. */
export const Countdown = ({ left, total, running, word, children }: CountdownProps) => {
  const minutes = Math.ceil(total / 60);
  const spent = total - left;

  return (
    <div className="fj-countdown" data-running={running ? "" : undefined}>
      <p className="fj-countdown-time" role="timer">
        <strong>{formatClock(left)}</strong>
        {word}
      </p>
      <div aria-hidden className="fj-ruler">
        {Array.from({ length: minutes }, (_, index) => {
          const used = Math.min(1, Math.max(0, (spent - index * 60) / 60));

          return (
            <span
              data-state={used >= 1 || !running ? "out" : undefined}
              key={`minute-${index + 1}`}
              style={cssVars({ "--fj-used": used })}
            />
          );
        })}
      </div>
      {children}
    </div>
  );
};
