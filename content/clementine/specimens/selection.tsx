import { useState } from "react";

import { Checkbox } from "../components/checkbox";
import { Chip } from "../components/chip";
import { RadioGroup } from "../components/radio";
import { Segmented } from "../components/segmented";
import { Slider } from "../components/slider";
import { Switch } from "../components/switch";
import { Specimen } from "../shell";

import "./specimens.css";

const CATEGORIES = ["Groceries", "Dining", "Transport", "Home", "Fun"] as const;
const RANGES = ["Week", "Month", "Year"] as const;

const SPEEDS = [
  { description: "Lands Friday", label: "Standard", trailing: "Free", value: "standard" },
  { description: "Lands before 6:00 pm", label: "Same day", trailing: "$1.50", value: "today" },
] as const;

export const SelectionSpecimens = () => {
  const [weekly, setWeekly] = useState(true);
  const [statement, setStatement] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]["value"]>("standard");
  const [roundUps, setRoundUps] = useState(true);
  const [payday, setPayday] = useState(false);
  const [multiplier, setMultiplier] = useState(2);
  const [range, setRange] = useState<(typeof RANGES)[number]>("Month");
  const [picked, setPicked] = useState<string[]>(["Dining"]);

  return (
    <>
      <Specimen
        name="Checkbox and radio"
        note="A tick or dot in ink when chosen. A chosen radio row also takes the pale wash, never the orange."
      >
        <div className="cl-spec-col">
          <Checkbox
            checked={weekly}
            description="Sunday evenings, one email"
            label="Weekly money note"
            onCheckedChange={setWeekly}
          />
          <Checkbox
            checked={statement}
            label="Post me paper statements"
            onCheckedChange={setStatement}
          />
          <RadioGroup
            label="Transfer speed"
            onValueChange={setSpeed}
            options={SPEEDS}
            value={speed}
          />
        </div>
      </Specimen>
      <Specimen
        name="Switch and slider"
        note="A switch that is on fills with flat orange, no ring. A slider fills with ink, so the orange stays rationed."
      >
        <div className="cl-spec-col">
          <Switch
            checked={roundUps}
            description="Card payments round up to the next dollar for Kyoto"
            label="Round-ups"
            onCheckedChange={setRoundUps}
          />
          <Switch
            checked={payday}
            description="Moves 10% into Rainy day as your pay lands"
            label="Payday tithe"
            onCheckedChange={setPayday}
          />
          <Slider
            format={(value) => `${String(value)}x`}
            label="Round-up multiplier"
            max={5}
            min={1}
            onValueChange={setMultiplier}
            value={multiplier}
          />
        </div>
      </Specimen>
      <Specimen
        name="Segmented and chip"
        note="The segment thumb slides on ease-out. Chosen chips show a tick as well as a tint, so color is never the only clue."
      >
        <div className="cl-spec-col">
          <Segmented label="Range" onValueChange={setRange} options={RANGES} value={range} />
          <fieldset className="cl-spec-row cl-fieldset">
            <legend className="cl-sr">Categories</legend>
            {CATEGORIES.map((category) => (
              <Chip
                key={category}
                onSelectedChange={(on) =>
                  setPicked((list) =>
                    on ? [...list, category] : list.filter((item) => item !== category),
                  )
                }
                selected={picked.includes(category)}
              >
                {category}
              </Chip>
            ))}
          </fieldset>
          <p className="cl-note" aria-live="polite">
            {picked.length === 0
              ? "Showing every category"
              : `Showing ${picked.join(", ")} for this ${range.toLowerCase()}`}
          </p>
        </div>
      </Specimen>
    </>
  );
};
