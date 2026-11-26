"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { flushSync } from "react-dom";

import { SakugaButton } from "./sakuga-button";
import { clamp, clock, later, onFrame } from "./sakuga-core";
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
import { FONT_BODY, SakugaStyle, SakugaTheme } from "./sakuga-react";
import type { SakugaThemeValues } from "./sakuga-react";

const Card = ({
  id,
  name,
  how,
  hints,
  wide = false,
  children,
}: {
  id: string;
  name: string;
  how: string;
  hints: boolean;
  wide?: boolean;
  children: ReactNode;
}) => (
  <section
    data-sk={id}
    className={`flex min-w-0 flex-col rounded-[18px] border-[1.5px] border-(--sk-rule) ${wide ? "sm:col-span-2" : ""}`}
  >
    <h2 className="px-4 pt-3.5 text-[15px] font-bold">{name}</h2>
    {hints ? <p className="px-4 pt-0.5 text-[13px] text-(--sk-dim)">{how}</p> : null}
    <div className="flex min-h-[230px] flex-1 flex-wrap items-center justify-center gap-[22px] px-4 py-6">
      {children}
    </div>
  </section>
);

const PrimaryCard = ({ hints, label }: { hints: boolean; label: string }) => {
  const [done, setDone] = useState(false);
  const run = useRef(0);

  return (
    <Card id="button" name="Primary button" how="Click it." hints={hints}>
      <SakugaButton
        done={done}
        onClick={() => {
          run.current += 1;
          setDone(false);
          later(760, () => {
            const n = run.current;
            flushSync(() => {
              setDone(true);
            });
            later(1800, () => {
              if (n === run.current) {
                flushSync(() => {
                  setDone(false);
                });
              }
            });
          });
        }}
      >
        {label}
      </SakugaButton>
    </Card>
  );
};

const ToastCard = ({ hints, message }: { hints: boolean; message: string }) => (
  <Card id="toast" name="Toast" how="Press Save." hints={hints}>
    <div className="relative grid justify-items-center gap-[22px]">
      <SakugaButton
        variant="secondary"
        onClick={() => {
          sakugaToast(message);
        }}
      >
        Save
      </SakugaButton>
      <SakugaToaster />
    </div>
  </Card>
);

const STAGES = [
  { label: "Key frames", value: "key" },
  { label: "In-betweens", value: "inbetween" },
  { label: "Clean-up", value: "cleanup" },
  { label: "Paint", value: "paint" },
];

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
            flushSync(() => {
              setValue(0);
            });
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

        flushSync(() => {
          setValue(next);
        });
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

const STOCK_THEME: Partial<SakugaThemeValues> = {};

const useClockSpeed = (speed: number) => {
  useLayoutEffect(() => {
    clock.speed = speed;

    return () => {
      clock.speed = 1;
    };
  }, [speed]);
};

/** Props for the Sakuga VFX showcase. */
export interface SakugaVfxProps {
  /** Overrides for the stock tokens, applied page-wide. */
  theme?: Partial<SakugaThemeValues>;
  /** Effect clock rate: 1 is real time, below 1 is slow motion. */
  speed?: number;
  /** Show the one-line "how to poke it" under each card title. */
  hints?: boolean;
  confirmLabel?: string;
  toastMessage?: string;
  tooltipText?: string;
}

export const SakugaVfx = ({
  theme = STOCK_THEME,
  speed = 1,
  hints = true,
  confirmLabel = "Confirm",
  toastMessage = "Saved successfully!",
  tooltipText = "Helpful hint!",
}: SakugaVfxProps) => {
  useClockSpeed(speed);

  return (
    <div
      className={`w-full max-w-[1080px] text-[15px] leading-[1.45] font-medium text-(--sk-ink) ${FONT_BODY}`}
    >
      <SakugaStyle />
      <SakugaTheme {...theme} />
      <div className="grid grid-flow-dense grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[18px]">
        <PrimaryCard hints={hints} label={confirmLabel} />
        <Card id="button-secondary" name="Secondary button" how="Click it." hints={hints}>
          <SakugaButton variant="secondary">Cancel</SakugaButton>
        </Card>
        <Card id="toggle" name="Switch" how="Flip it, then flip it back." hints={hints}>
          <SakugaSwitch aria-label="Notifications" />
        </Card>
        <Card
          id="slider"
          name="Slider"
          how="Drag it fast, and let go while it is moving."
          hints={hints}
        >
          <SakugaSlider defaultValue={30} aria-label="Volume" />
        </Card>
        <Card id="checkbox" name="Checkbox" how="Tick it." hints={hints}>
          <label
            htmlFor="sk-remember"
            className="flex cursor-pointer items-center gap-[12px] text-[15px] leading-[1.4] font-medium text-(--sk-ink) select-none"
          >
            <SakugaCheckbox id="sk-remember" />
            Remember me
          </label>
        </Card>
        <Card id="radio" name="Radio group" how="Pick the other one." hints={hints}>
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
        <Card id="input" name="Input" how="Click it and type." hints={hints}>
          <SakugaInput aria-label="Text" placeholder="Type something" autoComplete="off" />
        </Card>
        <Card id="tabs" name="Tabs" how="Pick another tab, or use the arrow keys." hints={hints}>
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
          hints={hints}
        >
          <LoadingDemo />
        </Card>
        <Card id="rating" name="Rating" how="Give it five." hints={hints}>
          <SakugaRating aria-label="Rating" />
        </Card>
        <ToastCard hints={hints} message={toastMessage} />
        <Card id="tooltip" name="Tooltip" how="Hover, focus or tap the button." hints={hints}>
          <SakugaTooltip className="mt-[60px]">
            <SakugaTooltipTrigger aria-label="Help">?</SakugaTooltipTrigger>
            <SakugaTooltipContent>{tooltipText}</SakugaTooltipContent>
          </SakugaTooltip>
        </Card>
        <Card
          id="stepper"
          name="Number field"
          how="Tap plus fast, then hit the limit."
          hints={hints}
        >
          <SakugaNumberField defaultValue={5} min={0} max={9}>
            <SakugaNumberFieldGroup>
              <SakugaNumberFieldDecrement />
              <SakugaNumberFieldInput aria-label="Copies" />
              <SakugaNumberFieldIncrement />
            </SakugaNumberFieldGroup>
          </SakugaNumberField>
        </Card>
        <Card
          id="select"
          name="Select"
          how="Open it, run down the rows, and choose one."
          hints={hints}
        >
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
        <Card id="accordion" name="Accordion" how="Open one, then another." hints={hints}>
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
        <Card
          id="chips"
          name="Chips"
          how="Type a tag and press Enter, then remove one."
          hints={hints}
        >
          <SakugaChips defaultValue={["Ink", "Paper"]}>
            <SakugaChipsList>
              <SakugaChipsInput placeholder="Add a tag" />
            </SakugaChipsList>
          </SakugaChips>
        </Card>
      </div>
    </div>
  );
};
