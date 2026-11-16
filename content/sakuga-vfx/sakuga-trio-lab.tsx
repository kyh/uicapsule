"use client";

// TEMPORARY bench. Delete before finishing.

import { useState } from "react";

import { SakugaCheckbox } from "./sakuga-checkbox";
import { SakugaRadioGroup, SakugaRadioGroupItem } from "./sakuga-radio-group";
import { SakugaSwitch } from "./sakuga-switch";

const ROW = "flex cursor-pointer items-center gap-[12px] select-none";
const mark = (el: HTMLElement | null) => {
  if (el) {
    el.dataset.gotRef = "";
  }
};
const never = () => {
  // refuses
};

export const TrioLab = () => {
  const [sent, setSent] = useState("");
  const [log, setLog] = useState("");
  const say = (word: string) => setLog((v) => `${v}${word} `);
  return (
    <div data-lab className="grid w-full gap-6 pb-[200px]">
      <form
        data-lab="form"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(JSON.stringify([...new FormData(e.currentTarget).entries()]));
        }}
      >
        <SakugaSwitch aria-label="x" name="wifi" defaultChecked ref={mark} />
        <SakugaSwitch aria-label="x" name="dark" value="yes" />
        <SakugaSwitch aria-label="x" />
        <SakugaRadioGroup aria-label="x" defaultValue="a">
          {/* oxlint-disable-next-line jsx-a11y/label-has-associated-control -- bench */}
          <label className={ROW}>
            <SakugaRadioGroupItem value="a" ref={mark} onPointerDown={() => say("pd")} onKeyDown={() => say("kd")} onBlur={() => say("bl")} />A
          </label>
          {/* oxlint-disable-next-line jsx-a11y/label-has-associated-control -- bench */}
          <label className={ROW}>
            <SakugaRadioGroupItem value="b" />B
          </label>
        </SakugaRadioGroup>
        <SakugaRadioGroup aria-label="x" name="plan" defaultValue="b">
          {/* oxlint-disable-next-line jsx-a11y/label-has-associated-control -- bench */}
          <label className={ROW}>
            <SakugaRadioGroupItem value="a" />A
          </label>
          {/* oxlint-disable-next-line jsx-a11y/label-has-associated-control -- bench */}
          <label className={ROW}>
            <SakugaRadioGroupItem value="b" />B
          </label>
        </SakugaRadioGroup>
        {/* oxlint-disable-next-line jsx-a11y/label-has-associated-control -- bench */}
        <label className={ROW}>
          <SakugaCheckbox name="keep" defaultChecked ref={mark} />
          Keep
        </label>
        <button type="submit">send</button>
        <button type="reset">reset</button>
        <output>{sent}</output>
        <samp>{log}</samp>
      </form>
      <div data-lab="over">
        <SakugaCheckbox aria-label="x" className="border-[6px] border-[rgb(255,0,0)]" />
        <SakugaSwitch aria-label="x" className="mt-[10px]" />
        <SakugaRadioGroup aria-label="x" className="gap-[30px]" value="a" onValueChange={never}>
          <SakugaRadioGroupItem aria-label="a" value="a" className="border-[rgb(0,128,0)]" />
          <SakugaRadioGroupItem aria-label="b" value="b" />
        </SakugaRadioGroup>
      </div>
    </div>
  );
};
