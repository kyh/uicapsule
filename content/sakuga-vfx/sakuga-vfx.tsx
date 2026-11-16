"use client";

// Sakuga VFX: every control in the set, live on one sheet of paper.

import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { flushSync } from "react-dom";

import { SakugaButton } from "./sakuga-button";
import { clamp, later, onFrame } from "./sakuga-core";
import {
  SakugaAccordion,
  SakugaAccordionContent,
  SakugaAccordionItem,
  SakugaAccordionTrigger,
} from "./sakuga-accordion";
import { SakugaCheckbox } from "./sakuga-checkbox";
import { SakugaChips, SakugaChipsInput, SakugaChipsList } from "./sakuga-chips";
import { SakugaInput } from "./sakuga-input";
import { SakugaProgress } from "./sakuga-progress";
import { SakugaRadioGroup, SakugaRadioGroupItem } from "./sakuga-radio-group";
import { SakugaRating } from "./sakuga-rating";
import {
  SakugaSelect,
  SakugaSelectContent,
  SakugaSelectItem,
  SakugaSelectTrigger,
  SakugaSelectValue,
} from "./sakuga-select";
import { SakugaSlider } from "./sakuga-slider";
import {
  SakugaNumberField,
  SakugaNumberFieldDecrement,
  SakugaNumberFieldGroup,
  SakugaNumberFieldIncrement,
  SakugaNumberFieldInput,
} from "./sakuga-number-field";
import { SakugaTabs, SakugaTabsList, SakugaTabsTrigger } from "./sakuga-tabs";
import { SakugaToaster, sakugaToast } from "./sakuga-toast";
import { SakugaSwitch } from "./sakuga-switch";
import { SakugaTooltip, SakugaTooltipContent, SakugaTooltipTrigger } from "./sakuga-tooltip";
import { FONT_BODY, SakugaStyle } from "./sakuga-react";

const Card = ({
  id,
  name,
  how,
  wide = false,
  children,
}: {
  id: string;
  name: string;
  how: string;
  wide?: boolean;
  children: ReactNode;
}) => (
  <section
    data-sk={id}
    className={`flex min-w-0 flex-col rounded-[18px] border-[1.5px] border-[#dcdaf0] ${wide ? "sm:col-span-2" : ""}`}
  >
    <h2 className="px-4 pt-3.5 text-[15px] font-bold">{name}</h2>
    <p className="px-4 pt-0.5 text-[13px] text-[#8580b0]">{how}</p>
    <div className="flex min-h-[230px] flex-1 flex-wrap items-center justify-center gap-[22px] px-4 py-6">
      {children}
    </div>
  </section>
);

// The demo's "work" takes 760ms, then the check stays for 1.8 seconds unless it is clicked again.
// The timers run on the set's clock, and flushSync lands the check on the frame the timer fires.
const PrimaryCard = () => {
  const [done, setDone] = useState(false);
  const run = useRef(0);
  return (
    <Card id="button" name="Primary button" how="Click it.">
      <SakugaButton
        done={done}
        onClick={() => {
          run.current += 1;
          setDone(false);
          later(760, () => {
            const n = run.current;
            flushSync(() => setDone(true));
            later(1800, () => {
              if (n === run.current) {
                flushSync(() => setDone(false));
              }
            });
          });
        }}
      >
        Confirm
      </SakugaButton>
    </Card>
  );
};

const ToastCard = () => (
  <Card id="toast" name="Toast" how="Press Save.">
    <div className="relative grid justify-items-center gap-[22px]">
      <SakugaButton variant="secondary" onClick={() => sakugaToast("Saved successfully!")}>
        Save
      </SakugaButton>
      <SakugaToaster />
    </div>
  </Card>
);

// the select card's rows
const STAGES = [
  { label: "Key frames", value: "key" },
  { label: "In-betweens", value: "inbetween" },
  { label: "Clean-up", value: "cleanup" },
  { label: "Paint", value: "paint" },
];

// The gallery plays a pretend load: the value climbs in surges on the shared clock, rests on the
// finished bar for 3.6s and starts again. A click starts it again at once. The frame is subscribed
// in a layout effect so it runs before the bar's own, and each frame's value is the one it eases to.
// A surge can dip, and a lower value would pull the bar back, so the value is held at where the bar
// has got to: `at` follows the bar's own easing (12% to 90% of the track a second).
const LoadingDemo = () => {
  const [value, setValue] = useState(0);
  const demo = useRef({ at: 0, doneAt: 0, goal: 0, t: 0 });
  useLayoutEffect(
    () =>
      onFrame((dt) => {
        const d = demo.current;
        d.t += dt;
        if (d.doneAt) {
          if (d.t - d.doneAt > 3.6) {
            d.doneAt = 0;
            d.goal = 0;
            d.at = 0;
            flushSync(() => setValue(0));
          }
          return;
        }
        d.goal = Math.min(
          1,
          d.goal + dt * (0.14 + 0.115 * Math.sin(d.t * 2.1) + 0.07 * Math.sin(d.t * 4.7)),
        );
        const next = Math.max(d.goal, d.at);
        if (d.at < d.goal) {
          d.at = Math.min(d.goal, d.at + dt * clamp((d.goal - d.at) * 3, 0.12, 0.9));
        }
        flushSync(() => setValue(next));
      }),
    [],
  );
  return (
    <SakugaProgress
      min={0}
      max={1}
      value={value}
      aria-label="Loading"
      className="cursor-pointer"
      onDone={() => {
        demo.current.doneAt = demo.current.t;
      }}
      onClick={() => {
        demo.current.doneAt = 0;
        demo.current.goal = 0;
        demo.current.at = 0;
        setValue(0);
      }}
    />
  );
};

export const SakugaVfx = () => (
  <div
    className={`w-full max-w-[1080px] text-[15px] leading-[1.45] font-medium text-[#1d1a4a] ${FONT_BODY}`}
  >
    <SakugaStyle />
    <div className="grid grid-flow-dense grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[18px]">
      <PrimaryCard />
      <Card id="button-secondary" name="Secondary button" how="Click it.">
        <SakugaButton variant="secondary">Cancel</SakugaButton>
      </Card>
      <Card id="toggle" name="Switch" how="Flip it, then flip it back.">
        <SakugaSwitch aria-label="Notifications" />
      </Card>
      <Card id="slider" name="Slider" how="Drag it fast, and let go while it is moving.">
        <SakugaSlider defaultValue={30} aria-label="Volume" />
      </Card>
      <Card id="checkbox" name="Checkbox" how="Tick it.">
        <label
          htmlFor="sk-remember"
          className="flex cursor-pointer items-center gap-[12px] text-[15px] leading-[1.4] font-medium text-(--sk-ink) select-none"
        >
          <SakugaCheckbox id="sk-remember" />
          Remember me
        </label>
      </Card>
      <Card id="radio" name="Radio group" how="Pick the other one.">
        <SakugaRadioGroup
          aria-label="Plan"
          defaultValue="a"
          className="text-[15px] leading-[1.4] font-medium text-(--sk-ink)"
        >
          <label
            htmlFor="sk-plan-a"
            className="flex cursor-pointer items-center gap-[12px] select-none"
          >
            <SakugaRadioGroupItem id="sk-plan-a" value="a" />
            Option A
          </label>
          <label
            htmlFor="sk-plan-b"
            className="flex cursor-pointer items-center gap-[12px] select-none"
          >
            <SakugaRadioGroupItem id="sk-plan-b" value="b" />
            Option B
          </label>
        </SakugaRadioGroup>
      </Card>
      <Card id="input" name="Input" how="Click it and type.">
        <SakugaInput aria-label="Text" placeholder="Type something" autoComplete="off" />
      </Card>
      <Card id="tabs" name="Tabs" how="Pick another tab, or use the arrow keys.">
        <SakugaTabs defaultValue="home">
          <SakugaTabsList aria-label="Sections">
            <SakugaTabsTrigger value="home">Home</SakugaTabsTrigger>
            <SakugaTabsTrigger value="profile">Profile</SakugaTabsTrigger>
            <SakugaTabsTrigger value="settings">Settings</SakugaTabsTrigger>
          </SakugaTabsList>
        </SakugaTabs>
      </Card>
      <Card
        id="progress"
        name="Progress"
        how="It plays a load by itself, in surges. Click it to start again."
        wide
      >
        <LoadingDemo />
      </Card>
      <Card id="rating" name="Rating" how="Give it five.">
        <SakugaRating aria-label="Rating" />
      </Card>
      <ToastCard />
      <Card id="tooltip" name="Tooltip" how="Hover, focus or tap the button.">
        <SakugaTooltip className="mt-[60px]">
          <SakugaTooltipTrigger aria-label="Help">?</SakugaTooltipTrigger>
          <SakugaTooltipContent>Helpful hint!</SakugaTooltipContent>
        </SakugaTooltip>
      </Card>
      <Card id="stepper" name="Number field" how="Tap plus fast, then hit the limit.">
        <SakugaNumberField defaultValue={5} min={0} max={9}>
          <SakugaNumberFieldGroup>
            <SakugaNumberFieldDecrement />
            <SakugaNumberFieldInput aria-label="Copies" />
            <SakugaNumberFieldIncrement />
          </SakugaNumberFieldGroup>
        </SakugaNumberField>
      </Card>
      <Card id="select" name="Select" how="Open it, run down the rows, and choose one.">
        <SakugaSelect defaultValue="key" items={STAGES}>
          <SakugaSelectTrigger aria-label="Stage">
            <SakugaSelectValue />
          </SakugaSelectTrigger>
          <SakugaSelectContent>
            {STAGES.map((stage) => (
              <SakugaSelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SakugaSelectItem>
            ))}
          </SakugaSelectContent>
        </SakugaSelect>
      </Card>
      <Card id="accordion" name="Accordion" how="Open one, then another.">
        <SakugaAccordion className="self-start">
          <SakugaAccordionItem>
            <SakugaAccordionTrigger>Shipping</SakugaAccordionTrigger>
            <SakugaAccordionContent>Tracked, and out in two days.</SakugaAccordionContent>
          </SakugaAccordionItem>
          <SakugaAccordionItem>
            <SakugaAccordionTrigger>Returns</SakugaAccordionTrigger>
            <SakugaAccordionContent>Thirty days to send it back.</SakugaAccordionContent>
          </SakugaAccordionItem>
          <SakugaAccordionItem>
            <SakugaAccordionTrigger>Warranty</SakugaAccordionTrigger>
            <SakugaAccordionContent>Two years, parts and labour.</SakugaAccordionContent>
          </SakugaAccordionItem>
        </SakugaAccordion>
      </Card>
      <Card id="chips" name="Chips" how="Type a tag and press Enter, then remove one.">
        <SakugaChips defaultValue={["Ink", "Paper"]}>
          <SakugaChipsList>
            <SakugaChipsInput placeholder="Add a tag" />
          </SakugaChipsList>
        </SakugaChips>
      </Card>
    </div>
  </div>
);
