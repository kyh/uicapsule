"use client";

import { useState } from "react";

import { Avatar } from "../components/avatar";
import { Button } from "../components/button";
import { Panel, Shell, ShellFoot } from "../components/card";
import { Checkbox } from "../components/checkbox";
import { Status } from "../components/status";
import type { StatusKind } from "../components/status";
import { useToast } from "../components/toast";
import { VoiceNote } from "../components/voice-note";

const OUTCOMES: readonly { label: string; status: StatusKind; word: string }[] = [
  { label: "Pricing table on phones", status: "waiting", word: "Open" },
  { label: "Onboarding art in dark mode", status: "waiting", word: "Open" },
  { label: "Keep onboarding to three steps", status: "ok", word: "Agreed" },
  { label: "Inbox empty state copy", status: "ok", word: "Agreed" },
];

interface Item {
  id: string;
  owner: string;
  text: string;
  done: boolean;
}

const ITEMS: readonly Item[] = [
  { done: false, id: "pricing", owner: "Kofi Mensah", text: "Mock the pricing table at 390 wide" },
  { done: true, id: "art", owner: "Ines Duarte", text: "Pull the dark onboarding art" },
  { done: false, id: "copy", owner: "Priya Sethi", text: "Send the empty state copy to review" },
];

const SPOKEN = "Also Ruth should check the pricing table with sales before Friday's release".split(
  " ",
);

const DICTATED: Item = {
  done: false,
  id: "sales",
  owner: "Ruth Okafor",
  text: "Check the pricing table with sales before Friday",
};

const Crit = () => (
  <Shell>
    <Panel>
      <ul aria-label="Design crit outcomes" className="v-rows">
        <li className="v-row">
          <span className="v-row-main">
            <span className="v-label">Design crit, Thursday</span>
            <span className="v-caption v-t2">38 min with Kofi, Ines, Priya and Ruth</span>
          </span>
        </li>
        {OUTCOMES.map((item) => (
          <li className="v-row v-row-hover" key={item.label}>
            <span className="v-body-sm v-grow">{item.label}</span>
            <Status status={item.status}>{item.word}</Status>
          </li>
        ))}
      </ul>
    </Panel>
    <ShellFoot meta="Notes taken by the meeting agent" />
  </Shell>
);

const Items = ({
  onDictate,
  items,
  done,
  onToggle,
}: {
  onDictate: () => void;
  items: readonly Item[];
  done: ReadonlySet<string>;
  onToggle: (id: string, checked: boolean) => void;
}) => {
  const toast = useToast();

  return (
    <Shell>
      <Panel>
        <div className="v-stack v-pad">
          <p className="v-label">Action items</p>
          {items.map((item) => (
            <div className="v-between v-items-start" key={item.id}>
              <Checkbox
                checked={done.has(item.id)}
                onCheckedChange={(checked) => {
                  onToggle(item.id, checked);
                }}
                strike
              >
                {item.text}
              </Checkbox>
              <Avatar name={item.owner} />
            </div>
          ))}
        </div>
      </Panel>
      <ShellFoot meta={`${items.length - done.size} still to do`}>
        <Button onClick={onDictate} size="sm" variant="secondary">
          Dictate one
        </Button>
        <Button
          onClick={() => {
            toast({ title: `Posted ${items.length} action items to #design` });
          }}
          size="sm"
        >
          Post to #design
        </Button>
      </ShellFoot>
    </Shell>
  );
};

/** A meeting agent's notes: what the crit settled, who owes what, and an item added by voice. */
export const NotesScreen = () => {
  const [started, setStarted] = useState<number | null>(null);
  const [items, setItems] = useState(ITEMS);

  const [done, setDone] = useState<ReadonlySet<string>>(
    () => new Set(ITEMS.flatMap((item) => (item.done ? [item.id] : []))),
  );

  const toggle = (id: string, checked: boolean) => {
    setDone((set) => {
      const next = new Set(set);

      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  };

  return (
    <div className="v-screen-cols">
      <div className="v-moment">
        <Crit />
      </div>
      <div className="v-moment">
        {started === null ? (
          <Items
            done={done}
            items={items}
            onDictate={() => {
              setStarted(Date.now());
            }}
            onToggle={toggle}
          />
        ) : (
          <Shell>
            <Panel padded>
              <VoiceNote
                onCancel={() => {
                  setStarted(null);
                }}
                onSave={() => {
                  setItems((list) =>
                    list.some((item) => item.id === DICTATED.id) ? list : [...list, DICTATED],
                  );
                  setStarted(null);
                }}
                started={started}
                words={SPOKEN}
              />
            </Panel>
          </Shell>
        )}
      </div>
    </div>
  );
};
