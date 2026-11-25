import { CircleCheck } from "lucide-react";

import { Arc } from "./arc";

/** The agent's current job in the present tense, rewritten in the past tense when it ends. */
export const Activity = ({
  active,
  doing,
  done,
}: {
  active: boolean;
  doing: string;
  done: string;
}) => (
  <output className="v-status" data-size="md" data-status={active ? "running" : "idle"}>
    {active ? <Arc small /> : <CircleCheck aria-hidden strokeWidth={2} />}
    {active ? doing : done}
  </output>
);
