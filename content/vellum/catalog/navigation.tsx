"use client";

import { useState } from "react";

import { Button } from "../components/button";
import { Steps } from "../components/steps";
import { Tabs, tabPanelProps } from "../components/tabs";
import { Specimen } from "../chrome";

const TABS = [
  { label: "Queued", value: "upcoming" },
  { label: "Done", value: "done" },
  { label: "Dropped", value: "skipped" },
] as const;

const LISTS = {
  done: ["Summarised the crit", "Tagged 38 login-loop tickets", "Graded the router"],
  skipped: ["Translate the changelog, superseded by v4.13"],
  upcoming: [
    "Re-index the API reference",
    "Draft the 4.12 release note",
    "Grade the router again at 1 am",
  ],
} as const;

const SETUP = [
  { detail: "Help center and API reference", title: "Connect the docs" },
  { detail: "search_docs and read_doc", title: "Pick its tools" },
  { detail: "50 questions from last month's tickets", title: "Grade it on real questions" },
  { title: "Put it in front of customers" },
] as const;

/** Tabs and steps. */
export const Navigation = () => {
  const [tab, setTab] = useState<(typeof TABS)[number]["value"]>("upcoming");
  const [step, setStep] = useState(2);

  return (
    <>
      <Specimen name="Tabs" note="a pressed-ink pill slides under the chosen tab">
        <div className="v-fill v-stack">
          <Tabs
            id="catalog-tabs"
            label="Agent jobs"
            onValueChange={setTab}
            tabs={TABS}
            value={tab}
          />
          <ul className="v-stack-sm" {...tabPanelProps("catalog-tabs", tab)}>
            {LISTS[tab].map((item) => (
              <li className="v-body-sm" key={item}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Specimen>
      <Specimen name="Steps" note="done, current, next">
        <div className="v-fill v-stack">
          <Steps current={step} steps={SETUP} />
          <div className="v-cluster">
            <Button
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
              size="sm"
              variant="secondary"
            >
              Back
            </Button>
            <Button disabled={step === SETUP.length} onClick={() => setStep(step + 1)} size="sm">
              {step >= SETUP.length - 1 ? "Finish setup" : "Next step"}
            </Button>
          </div>
        </div>
      </Specimen>
    </>
  );
};
