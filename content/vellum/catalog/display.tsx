"use client";

import { useState } from "react";

import { Avatar } from "../components/avatar";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Panel, Shell, ShellFoot } from "../components/card";
import { DataList } from "../components/data-list";
import { Kbd } from "../components/kbd";
import { Specimen } from "../chrome";

/** Card, badge, avatar, kbd and data list. */
export const Display = () => {
  const [choice, setChoice] = useState<"open" | "kept" | "diff">("open");

  return (
    <>
      <Specimen name="Card" note="shell, panel 3px in, footer: meta, a flat way out, one lead">
        <div className="v-fill">
          <Shell>
            <Panel padded>
              <div className="v-stack-sm v-gap-2">
                <p className="v-label">Prompt v12 is ready</p>
                <p className="v-body-sm v-t2">
                  Shorter system prompt for the docs agent, 30% fewer tokens, same grades on 200
                  cases.
                </p>
              </div>
            </Panel>
            <ShellFoot
              meta={
                <span aria-live="polite">
                  {
                    {
                      diff: "Showing 14 changed lines",
                      kept: "Staying on v11",
                      open: "Drafted by Priya",
                    }[choice]
                  }
                </span>
              }
            >
              <Button onClick={() => setChoice("kept")} size="sm" variant="secondary">
                Keep v11
              </Button>
              <Button onClick={() => setChoice("diff")} size="sm">
                See the diff
              </Button>
            </ShellFoot>
          </Shell>
        </div>
      </Specimen>
      <Specimen name="Data list" note="label and value, one 36px row each">
        <div className="v-fill">
          <Shell>
            <Panel>
              <DataList
                items={[
                  { label: "Agent", value: "Docs answerer" },
                  { label: "Model", value: "Quill 4, mini on easy turns" },
                  { label: "Tools", value: "search_docs, read_doc" },
                  { label: "Run", value: <code>run_8f2c1a</code> },
                ]}
              />
            </Panel>
          </Shell>
        </div>
      </Specimen>
      <Specimen
        name="Badge, avatar and kbd"
        note="labels that never change, people as initials, keys"
        span={2}
      >
        <div className="v-cluster v-center v-gap-20">
          <div className="v-cluster">
            <Badge>v12</Badge>
            <Badge tone="outline">Draft</Badge>
            <Badge tone="ok">Graded</Badge>
            <Badge tone="warn">Flaky</Badge>
            <Badge tone="fail">Regressed</Badge>
          </div>
          <div className="v-avatar-stack">
            <Avatar name="Ines Duarte" />
            <Avatar name="Kofi Mensah" />
            <Avatar name="Priya Sethi" />
          </div>
          <span className="v-caption v-t2">
            Ask <Kbd>⌘</Kbd> <Kbd>K</Kbd> · Run <Kbd>⌘</Kbd> <Kbd>↵</Kbd>
          </span>
        </div>
      </Specimen>
    </>
  );
};
