"use client";

import { useState } from "react";

import { Checkbox } from "../components/checkbox";
import { RadioGroup } from "../components/radio-group";
import { Segmented } from "../components/segmented";
import { Select } from "../components/select";
import { Slider } from "../components/slider";
import { Switch } from "../components/switch";
import { Specimen } from "../chrome";

const TONES = [
  { hint: "The answer, then the link", label: "Terse", value: "brief" },
  { hint: "A sentence of context first", label: "Plain", value: "warm" },
  { hint: "Steps, code and caveats", label: "Thorough", value: "formal" },
] as const;

const RANGE = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
] as const;

const CALENDARS = [
  { label: "Quill 4", value: "personal" },
  { label: "Quill 4 mini", value: "household" },
  { label: "Ledger 2", value: "work" },
] as const;

/** Checkbox, radio group, switch, slider, segmented control and select. */
export const Selection = () => {
  const [items, setItems] = useState<Record<string, boolean>>({
    calendar: true,
    mail: true,
    sms: false,
  });

  const [tone, setTone] = useState<(typeof TONES)[number]["value"]>("warm");
  const [quiet, setQuiet] = useState(true);
  const [digest, setDigest] = useState(false);
  const [limit, setLimit] = useState(50);
  const [range, setRange] = useState<(typeof RANGE)[number]["value"]>("week");
  const [calendar, setCalendar] = useState<(typeof CALENDARS)[number]["value"]>("household");

  return (
    <>
      <Specimen name="Checkbox" note="the tick draws in left to right">
        <div className="v-stack v-self-center">
          {[
            ["mail", "Read the help center"],
            ["calendar", "Search past tickets"],
            ["sms", "Write to the CRM"],
          ].map(([key = "", label]) => (
            <Checkbox
              checked={items[key] ?? false}
              key={key}
              onCheckedChange={(checked) => setItems((current) => ({ ...current, [key]: checked }))}
            >
              {label}
            </Checkbox>
          ))}
        </div>
      </Specimen>
      <Specimen name="Radio group" note="one choice that stays visible">
        <div className="v-self-center">
          <RadioGroup label="Answer length" onValueChange={setTone} options={TONES} value={tone} />
        </div>
      </Specimen>
      <Specimen name="Switch" note="no save button; it applies when flipped">
        <div className="v-stack v-self-center">
          <Switch checked={quiet} label="Show sources under answers" onCheckedChange={setQuiet} />
          <Switch checked={digest} label="Keep traces for 30 days" onCheckedChange={setDigest} />
          <Switch
            checked
            label="Mask customer emails in traces, set by Ruth"
            disabled
            onCheckedChange={() => null}
          />
        </div>
      </Specimen>
      <Specimen name="Slider" note="the track fills in ink">
        <div className="v-fill">
          <Slider
            format={(value) => (value === 0 ? "Off" : `${value} turns`)}
            label="Hand off to a person after"
            max={200}
            onValueChange={setLimit}
            step={10}
            value={limit}
          />
        </div>
      </Specimen>
      <Specimen name="Segmented control" note="the paper thumb slides in 200ms">
        <div className="v-stack v-text-center">
          <Segmented label="Range" onValueChange={setRange} options={RANGE} value={range} />
          <span className="v-caption v-t2">
            {
              {
                day: "1,904 runs today",
                month: "51,280 runs in October",
                week: "13,402 runs this week",
              }[range]
            }
          </span>
        </div>
      </Specimen>
      <Specimen name="Select" note="a pill trigger and a ring-lifted list">
        <div className="v-stack v-text-center">
          <Select
            hideLabel={false}
            label="Fallback model"
            onValueChange={setCalendar}
            options={CALENDARS}
            value={calendar}
          />
        </div>
      </Specimen>
    </>
  );
};
