"use client";

// TEMPORARY: a bench for prop paths the gallery does not show. Delete before finishing.

import { useState } from "react";

import { SakugaCheckbox } from "./sakuga-checkbox";
import { SakugaRadioGroup, SakugaRadioGroupItem } from "./sakuga-radio-group";
import { SakugaSwitch } from "./sakuga-switch";

const never = () => {
  // refuses every change
};

const ROW = "flex cursor-pointer items-center gap-[12px] select-none";

const Pair = ({ only = false }: { only?: boolean }) => (
  <>
    {/* oxlint-disable-next-line jsx-a11y/label-has-associated-control -- bench */}
    <label className={ROW}>
      <SakugaRadioGroupItem value="a" />
      Option A
    </label>
    {!only && (
      // oxlint-disable-next-line jsx-a11y/label-has-associated-control -- bench
      <label className={ROW}>
        <SakugaRadioGroupItem value="b" />
        Option B
      </label>
    )}
  </>
);

export const TrioLab = () => {
  const [on, setOn] = useState(false);
  const [box, setBox] = useState(false);
  const [plan, setPlan] = useState("a");
  const [fewer, setFewer] = useState(false);
  const [sent, setSent] = useState("");
  const [late, setLate] = useState(false);
  return (
    <div data-lab className="grid w-full gap-6 pb-[200px]">
      <div data-lab="double">
        <SakugaSwitch aria-label="double" />
        <button
          type="button"
          onClick={(e) => {
            const sw = e.currentTarget.parentElement?.querySelector<HTMLElement>("[role=switch]");
            sw?.click();
            sw?.click();
          }}
        >
          twice
        </button>
      </div>
      <div data-lab="t-reject">
        <SakugaSwitch aria-label="x" checked={false} onCheckedChange={never} />
      </div>
      <div data-lab="t-reject-on">
        <SakugaSwitch aria-label="x" checked onCheckedChange={never} />
      </div>
      <div data-lab="t-cancel">
        <SakugaSwitch aria-label="x" onCheckedChange={(_, d) => d.cancel()} />
      </div>
      <div data-lab="t-own">
        <SakugaSwitch aria-label="x" checked={on} onCheckedChange={setOn} />
        <button type="button" onClick={() => setOn((v) => !v)}>
          code
        </button>
      </div>
      <div data-lab="t-late">
        <SakugaSwitch aria-label="x" checked={late} onCheckedChange={never} />
        <button type="button" onClick={() => setLate(true)}>
          late on
        </button>
      </div>
      <div data-lab="t-broken">
        <SakugaSwitch aria-label="x" frames="https://sprite.invalid/none.webp" />
      </div>
      <div data-lab="t-off">
        <SakugaSwitch aria-label="x" disabled />
        <SakugaCheckbox aria-label="x" disabled />
        <SakugaRadioGroup aria-label="x" disabled defaultValue="a">
          <Pair />
        </SakugaRadioGroup>
      </div>
      <div data-lab="t-named">
        <span id="lab-name">Wifi</span>
        <SakugaSwitch id="lab-switch" aria-labelledby="lab-name" />
        <span id="lab-group">Plan</span>
        <SakugaRadioGroup id="lab-radios" aria-labelledby="lab-group">
          <Pair />
        </SakugaRadioGroup>
        {/* oxlint-disable-next-line jsx-a11y/label-has-associated-control -- bench */}
        <label data-lab="t-label">
          <SakugaSwitch /> Labelled by wrapping
        </label>
      </div>
      <form
        data-lab="form"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(JSON.stringify([...new FormData(e.currentTarget).entries()]));
        }}
      >
        <SakugaSwitch aria-label="x" name="wifi" defaultChecked />
        <SakugaSwitch aria-label="x" name="dark" value="yes" />
        <SakugaSwitch aria-label="x" />
        <SakugaRadioGroup aria-label="x" defaultValue="a">
          <Pair />
        </SakugaRadioGroup>
        <SakugaRadioGroup aria-label="x" name="plan" defaultValue="b">
          <Pair />
        </SakugaRadioGroup>
        {/* oxlint-disable-next-line jsx-a11y/label-has-associated-control -- bench */}
        <label className={ROW}>
          <SakugaCheckbox name="keep" defaultChecked />
          Keep
        </label>
        <button type="submit">send</button>
        <button type="reset">reset</button>
        <output>{sent}</output>
      </form>
      <div data-lab="r-reject">
        <SakugaRadioGroup aria-label="x" value="a" onValueChange={never}>
          <Pair />
        </SakugaRadioGroup>
      </div>
      <div data-lab="r-own">
        <SakugaRadioGroup aria-label="x" value={plan} onValueChange={setPlan}>
          <Pair />
        </SakugaRadioGroup>
        <button type="button" onClick={() => setPlan((v) => (v === "a" ? "b" : "a"))}>
          code
        </button>
      </div>
      <div data-lab="r-fewer">
        <SakugaRadioGroup aria-label="x" defaultValue="b" name="few">
          <Pair only={fewer} />
        </SakugaRadioGroup>
        <button type="button" onClick={() => setFewer((v) => !v)}>
          fewer
        </button>
      </div>
      <div data-lab="c-reject">
        {/* oxlint-disable-next-line jsx-a11y/label-has-associated-control -- bench */}
        <label className={ROW}>
          <SakugaCheckbox checked={false} onCheckedChange={never} />
          Refused
        </label>
      </div>
      <div data-lab="c-own">
        {/* oxlint-disable-next-line jsx-a11y/label-has-associated-control -- bench */}
        <label className={ROW}>
          <SakugaCheckbox checked={box} onCheckedChange={setBox} />
          Remember me
        </label>
      </div>
    </div>
  );
};
