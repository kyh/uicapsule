import { CircleCheck, CircleX, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "../components/button";
import { Panel, Shell, ShellFoot } from "../components/card";
import { Field } from "../components/field";
import { Status } from "../components/status";

interface Rule {
  id: string;
  rule: string;
  because: string;
  wrong: ReactNode;
  right: ReactNode;
}

const RULES: readonly Rule[] = [
  {
    because:
      "When a whole card gleams, the eye goes looking for the button and finds a slab. The gloss belongs to the one control the card is waiting on.",
    id: "glass",
    right: (
      <Shell className="v-slop-w">
        <Panel padded>
          <span className="v-label">Prompt v12</span>
        </Panel>
        <ShellFoot meta="Graded on 200 cases">
          <Button size="sm">Publish</Button>
        </ShellFoot>
      </Shell>
    ),
    rule: "Gloss belongs to one button",
    wrong: (
      <div className="v-glass v-slop-w v-slop-glass">
        <span className="v-label">Prompt v12</span>
        <p className="v-caption">Graded on 200 cases</p>
      </div>
    ),
  },
  {
    because:
      "Vellum is one flat sheet. A blur under a menu invents a lamp somewhere above it; paper and a hairline ring are lift enough.",
    id: "shadow",
    right: (
      <div className="v-overlay v-slop-menu">
        <span className="v-menu-item">Duplicate agent</span>
        <span className="v-menu-item">Archive agent</span>
      </div>
    ),
    rule: "Ring it, do not shadow it",
    wrong: (
      <div className="v-slop-shadow v-slop-menu">
        <span className="v-menu-item">Duplicate agent</span>
        <span className="v-menu-item">Archive agent</span>
      </div>
    ),
  },
  {
    because:
      "Painting a gain green says it passed. It is a measurement: print it in ink and keep green for work that is done.",
    id: "metric",
    right: (
      <p className="v-body-sm">
        63.7% resolved <span className="v-t2">· 4.8 points over v11</span>
      </p>
    ),
    rule: "A number is not a status",
    wrong: (
      <p className="v-cluster v-gap-8 v-body-sm">
        63.7% resolved <Status status="ok">+4.8 pts</Status>
      </p>
    ),
  },
  {
    because:
      "A dot is only hue. Print the page in grey, or read it with red-green colour blindness, and Holds and Regressed turn into one blob.",
    id: "dots",
    right: (
      <div className="v-stack-sm">
        <Status status="ok">Holds</Status>
        <Status status="fail">Regressed</Status>
      </div>
    ),
    rule: "Say the state in a word",
    wrong: (
      <div className="v-stack-sm v-caption">
        <span>
          <span className="v-slop-dot" data-tone="ok" />
          Recall
        </span>
        <span>
          <span className="v-slop-dot" data-tone="fail" />
          Scope
        </span>
      </div>
    ),
  },
  {
    because:
      "A small capitalised kicker above a title says the same thing again, quieter, and makes the reader parse two lines to learn one name.",
    id: "eyebrow",
    right: <h4 className="v-heading">Support triage</h4>,
    rule: "One heading, said once, in sentence case",
    wrong: (
      <div className="v-stack-sm v-gap-2">
        <span className="v-slop-caps">Agents</span>
        <h4 className="v-heading">Support triage</h4>
      </div>
    ),
  },
  {
    because:
      "Placeholder ink sits below reading contrast and disappears with the first keystroke, taking the question with it.",
    id: "placeholder",
    right: (
      <div className="v-slop-w">
        <Field label="Escalation email" placeholder="oncall@northfield.app" />
      </div>
    ),
    rule: "A placeholder never stands in for a label",
    wrong: (
      <div className="v-slop-w">
        <Field hideLabel label="Escalation email" placeholder="Escalation email" />
      </div>
    ),
  },
  {
    because:
      "A coloured stripe on the left of a row reads as a code without a key. The picked row only takes a deeper wash of ink.",
    id: "rail",
    right: (
      <div className="v-panel v-slop-w">
        <div className="v-row v-slop-chosen">
          <span className="v-body-sm">Batch requests</span>
        </div>
      </div>
    ),
    rule: "Selection is a wash, never a stripe",
    wrong: (
      <div className="v-slop-rail v-slop-w">
        <div className="v-row">
          <span className="v-body-sm">Batch requests</span>
        </div>
      </div>
    ),
  },
  {
    because:
      "Big promises describe a mood. Saying what runs, when, and who hears about it is what lets someone hand work to an agent.",
    id: "hype",
    right: (
      <div className="v-stack-sm v-items-start">
        <p className="v-body-sm">Grades the router at 1 am and pages you on a regression.</p>
        <Button size="sm">Turn on</Button>
      </div>
    ),
    rule: "Describe what happens",
    wrong: (
      <div className="v-stack-sm v-items-start">
        <p className="v-body-sm">Supercharge your agents with effortless AI magic.</p>
        <span className="v-btn v-slop-gradient" data-size="sm">
          <Sparkles aria-hidden />
          Unleash it
        </span>
      </div>
    ),
  },
];

/** Eight reflexes Vellum turns down, each shown both ways. */
export const AntiSlop = () => (
  <div className="v-rules">
    {RULES.map((rule) => (
      <article className="v-rule" key={rule.id}>
        <div className="v-stack-sm v-gap-2">
          <h4 className="v-label-lg">{rule.rule}</h4>
          <p className="v-body-sm v-t2">{rule.because}</p>
        </div>
        <div className="v-rule-pair">
          <div className="v-rule-side">
            <div aria-hidden className="v-stage" inert>
              {rule.wrong}
            </div>
            <span className="v-verdict" data-bad="">
              <CircleX aria-hidden />
              Don’t
            </span>
          </div>
          <div className="v-rule-side">
            <div className="v-stage" inert>
              {rule.right}
            </div>
            <span className="v-verdict" data-ok="">
              <CircleCheck aria-hidden />
              Do
            </span>
          </div>
        </div>
      </article>
    ))}
  </div>
);
