"use client";

// Sakuga VFX: every control in the set, live on one sheet of paper.

import { useRef } from "react";
import type { ReactNode } from "react";

import { SakugaButton } from "./sakuga-button";
import type { SakugaButtonHandle } from "./sakuga-button";
import { later } from "./sakuga-core";
import { SakugaAccordion } from "./sakuga-accordion";
import { SakugaCheckbox } from "./sakuga-checkbox";
import { SakugaChips } from "./sakuga-chips";
import { SakugaInput } from "./sakuga-input";
import { SakugaProgress } from "./sakuga-progress";
import { SakugaRadio } from "./sakuga-radio";
import { SakugaRating } from "./sakuga-rating";
import { SakugaSelect } from "./sakuga-select";
import { SakugaSlider } from "./sakuga-slider";
import { SakugaStepper } from "./sakuga-stepper";
import { SakugaTabs } from "./sakuga-tabs";
import { SakugaToast } from "./sakuga-toast";
import type { SakugaToastHandle } from "./sakuga-toast";
import { SakugaToggle } from "./sakuga-toggle";
import { SakugaTooltip } from "./sakuga-tooltip";
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

const PrimaryCard = () => {
  const button = useRef<SakugaButtonHandle>(null);
  return (
    <Card id="button" name="Primary button" how="Click it.">
      <SakugaButton ref={button} onClick={() => later(760, () => button.current?.done())}>
        Confirm
      </SakugaButton>
    </Card>
  );
};

const ToastCard = () => {
  const toast = useRef<SakugaToastHandle>(null);
  return (
    <Card id="toast" name="Toast" how="Press Save.">
      <div className="relative grid justify-items-center gap-[22px]">
        <SakugaButton
          variant="secondary"
          onClick={() => toast.current?.show("Saved successfully!")}
        >
          Save
        </SakugaButton>
        <SakugaToast ref={toast} />
      </div>
    </Card>
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
        <SakugaToggle label="Notifications" />
      </Card>
      {/* ── slider card ── */}
      <Card id="slider" name="Slider" how="Drag it fast, and let go while it is moving.">
        <SakugaSlider defaultValue={30} label="Volume" />
      </Card>
      {/* ── checkbox card ── */}
      <Card id="checkbox" name="Checkbox" how="Tick it.">
        <SakugaCheckbox>Remember me</SakugaCheckbox>
      </Card>
      {/* ── radio card ── */}
      <Card id="radio" name="Radio" how="Pick the other one.">
        <SakugaRadio
          label="Plan"
          defaultValue="a"
          options={[
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ]}
        />
      </Card>
      {/* ── input card ── */}
      <Card id="input" name="Text input" how="Click it and type.">
        <SakugaInput label="Text" placeholder="Type something" />
      </Card>
      {/* ── tabs card ── */}
      <Card id="tabs" name="Tabs" how="Pick another tab, or use the arrow keys.">
        <SakugaTabs
          label="Sections"
          tabs={[{ label: "Home" }, { label: "Profile" }, { label: "Settings" }]}
        />
      </Card>
      {/* ── progress card ── */}
      <Card
        id="progress"
        name="Progress"
        how="It plays a load by itself, in surges. Click it to start again."
        wide
      >
        <SakugaProgress demo label="Loading" />
      </Card>
      {/* ── rating card ── */}
      <Card id="rating" name="Rating" how="Give it five.">
        <SakugaRating label="Rating" />
      </Card>
      {/* ── toast card ── */}
      <ToastCard />
      {/* ── tooltip card ── */}
      <Card id="tooltip" name="Tooltip" how="Hover, focus or tap the button.">
        <SakugaTooltip text="Helpful hint!" />
      </Card>
      {/* ── stepper card ── */}
      <Card id="stepper" name="Stepper" how="Tap plus fast, then hit the limit.">
        <SakugaStepper defaultValue={5} max={9} label="Copies" name="copies" />
<SakugaStepper disabled name="off" />
      </Card>
      {/* ── select card ── */}
      <Card id="select" name="Select" how="Open it, run down the rows, and choose one.">
        <SakugaSelect name="stage" />
<SakugaSelect disabled name="off2" />
      </Card>
      {/* ── accordion card ── */}
      <Card id="accordion" name="Accordion" how="Open one, then another.">
        <div className="flex h-[212px] w-full items-start justify-center">
          <SakugaAccordion />
        </div>
      </Card>
      {/* ── chips card ── */}
      <Card id="chips" name="Chips" how="Type a tag and press Enter, then remove one.">
        <SakugaChips />
      </Card>
    </div>
  </div>
);
