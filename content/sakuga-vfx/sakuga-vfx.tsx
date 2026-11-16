"use client";

// Sakuga VFX: every control in the set, live on one sheet of paper.

import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { flushSync } from "react-dom";

import { SakugaButton } from "./sakuga-button";
import { later, onFrame } from "./sakuga-core";
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
const LoadingDemo = () => {
  const [value, setValue] = useState(0);
  const demo = useRef({ doneAt: 0, goal: 0, t: 0 });
  useLayoutEffect(() => {
    Reflect.set(globalThis, "__skDemo", demo.current); // TEMP-PROBE
    return onFrame((dt) => {
      const d = demo.current;
      d.t += dt;
      if (d.doneAt) {
        if (d.t - d.doneAt > 3.6) {
          d.doneAt = 0;
          d.goal = 0;
          flushSync(() => setValue(0));
        }
        return;
      }
      d.goal = Math.min(
        1,
        d.goal + dt * (0.14 + 0.115 * Math.sin(d.t * 2.1) + 0.07 * Math.sin(d.t * 4.7)),
      );
      flushSync(() => setValue(d.goal));
    });
  }, []);
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
      {/* ── toggle card ── */}
      <Card id="toggle" name="Toggle" how="Flip it, then flip it back.">
        <SakugaSwitch aria-label="Notifications" />
      </Card>
      {/* ── slider card ── */}
      <Card id="slider" name="Slider" how="Drag it fast, and let go while it is moving.">
        <SakugaSlider defaultValue={30} aria-label="Volume" />
      </Card>
      {/* ── checkbox card ── */}
      <Card id="checkbox" name="Checkbox" how="Tick it.">
        <label
          htmlFor="sk-remember"
          className="flex cursor-pointer items-center gap-[12px] text-[15px] leading-[1.4] font-medium text-(--sk-ink) select-none"
        >
          <SakugaCheckbox id="sk-remember" />
          Remember me
        </label>
      </Card>
      {/* ── radio card ── */}
      <Card id="radio" name="Radio" how="Pick the other one.">
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
      {/* ── input card ── */}
      <Card id="input" name="Text input" how="Click it and type.">
        <SakugaInput aria-label="Text" placeholder="Type something" autoComplete="off" />
      </Card>
      {/* ── tabs card ── */}
      <Card id="tabs" name="Tabs" how="Pick another tab, or use the arrow keys.">
        <SakugaTabs defaultValue="home">
          <SakugaTabsList aria-label="Sections">
            <SakugaTabsTrigger value="home">Home</SakugaTabsTrigger>
            <SakugaTabsTrigger value="profile">Profile</SakugaTabsTrigger>
            <SakugaTabsTrigger value="settings">Settings</SakugaTabsTrigger>
          </SakugaTabsList>
        </SakugaTabs>
      </Card>
      {/* ── progress card ── */}
      <Card
        id="progress"
        name="Progress"
        how="It plays a load by itself, in surges. Click it to start again."
        wide
      >
        <LoadingDemo />
      </Card>
      {/* ── rating card ── */}
      <Card id="rating" name="Rating" how="Give it five.">
        <SakugaRating aria-label="Rating" />
      </Card>
      {/* ── toast card ── */}
      <ToastCard />
      {/* ── tooltip card ── */}
      <Card id="tooltip" name="Tooltip" how="Hover, focus or tap the button.">
        <SakugaTooltip className="mt-[60px]">
          <SakugaTooltipTrigger aria-label="Help">?</SakugaTooltipTrigger>
          <SakugaTooltipContent>Helpful hint!</SakugaTooltipContent>
        </SakugaTooltip>
      </Card>
      {/* ── stepper card ── */}
      <Card id="stepper" name="Stepper" how="Tap plus fast, then hit the limit.">
        <SakugaNumberField defaultValue={5} min={0} max={9}>
          <SakugaNumberFieldGroup>
            <SakugaNumberFieldDecrement />
            <SakugaNumberFieldInput aria-label="Copies" />
            <SakugaNumberFieldIncrement />
          </SakugaNumberFieldGroup>
        </SakugaNumberField>
      </Card>
      {/* ── select card ── */}
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
      {/* ── accordion card ── */}
      <Card id="accordion" name="Accordion" how="Open one, then another.">
        <SakugaAccordion data-t="refs" ref={(n) => { (globalThis as { tRefs?: string[] }).tRefs = [...((globalThis as { tRefs?: string[] }).tRefs ?? []), `root:${n?.dataset.slot}`]; }}><SakugaAccordionItem><SakugaAccordionTrigger ref={(n) => { (globalThis as { tRefs?: string[] }).tRefs?.push(`trigger:${n?.dataset.slot}`); }} onPointerDown={() => console.info("t-down")} onBlur={() => console.info("t-blur")}>R</SakugaAccordionTrigger><SakugaAccordionContent ref={(n) => { (globalThis as { tRefs?: string[] }).tRefs?.push(`content:${n?.dataset.slot}`); }}>rr</SakugaAccordionContent></SakugaAccordionItem></SakugaAccordion>
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
      {/* ── chips card ── */}
      <Card id="chips" name="Chips" how="Type a tag and press Enter, then remove one.">
        <form data-t><SakugaChips defaultValue={["Ink", "Paper"]} name="t"><SakugaChipsList ref={(n) => { (globalThis as { tRefs?: string[] }).tRefs?.push(`list:${n?.dataset.slot}`); }} onPointerDown={() => console.info("l-down")}><SakugaChipsInput ref={(n) => { (globalThis as { tRefs?: string[] }).tRefs?.push(`input:${n?.dataset.slot}`); }} onKeyDown={() => console.info("i-key")} /></SakugaChipsList></SakugaChips><button type="reset">reset</button></form>
        <SakugaChips data-t="rej" value={["Ink", "Paper"]}><SakugaChipsList><SakugaChipsInput /></SakugaChipsList></SakugaChips>
        <SakugaChips defaultValue={["Ink", "Paper"]}>
          <SakugaChipsList>
            <SakugaChipsInput placeholder="Add a tag" />
          </SakugaChipsList>
        </SakugaChips>
      </Card>
    </div>
  </div>
);
