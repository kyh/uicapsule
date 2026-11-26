import { useState } from "react";

import { Dropzone } from "../components/dropzone";
import { Figure } from "../components/figure";
import { Stepper } from "../components/stepper";
import { Input, Textarea } from "../components/field";
import { Keypad } from "../components/keypad";
import { Select } from "../components/select";
import { formatAmount } from "../lib/format";
import { Specimen } from "../shell";

import "./specimens.css";

const ACCOUNTS = [
  { label: "Everyday, $3,182.47", value: "everyday" },
  { label: "Kyoto in April, $1,140.00", value: "kyoto" },
  { label: "Rainy day, $6,420.15", value: "rainy" },
] as const;

export const InputSpecimens = () => {
  const [goal, setGoal] = useState("Kyoto in April");
  const [target, setTarget] = useState("2400");
  const [note, setNote] = useState("Half of the cabin for the long weekend");
  const [account, setAccount] = useState<(typeof ACCOUNTS)[number]["value"]>("everyday");
  const [typed, setTyped] = useState("12.5");
  const [files, setFiles] = useState<string[]>([]);
  const [budget, setBudget] = useState(150);
  const targetError = Number(target) > 50_000 ? "Goals go up to $50,000.00" : undefined;

  return (
    <>
      <Specimen
        name="Input"
        note="The label sits above, the field is a 14px soft square on warm paper, and text is 16px so phones never zoom in."
      >
        <div className="cl-spec-col">
          <Input
            label="Goal name"
            onChange={(event) => {
              setGoal(event.target.value);
            }}
            value={goal}
          />
          <Input
            description="Try a number over 50,000 to see the error."
            error={targetError}
            inputMode="decimal"
            label="Target"
            onChange={(event) => {
              setTarget(event.target.value.replaceAll(/[^0-9.]/gu, ""));
            }}
            prefix="$"
            value={target}
          />
        </div>
      </Specimen>
      <Specimen
        name="Textarea and select"
        note="Same shape and fill as the input. The select stays native so phones show their own picker."
      >
        <div className="cl-spec-col">
          <Textarea
            label="Note to Teodor"
            onChange={(event) => {
              setNote(event.target.value);
            }}
            rows={3}
            value={note}
          />
          <Select label="Pay from" onValueChange={setAccount} options={ACCOUNTS} value={account} />
        </div>
      </Specimen>
      <Specimen
        name="Keypad"
        note="Holds the amount as typed text, so it refuses a second point, a third decimal and a leading zero."
      >
        <div className="cl-spec-col cl-spec-col--narrow">
          <Figure align="center" as="output" live value={Number(typed || "0")} />
          <Keypad onValueChange={setTyped} value={typed} />
        </div>
      </Specimen>
      <Specimen
        name="Stepper"
        note="For amounts set by feel, like a budget. Each press moves $25.00, and a button stops at the edge."
      >
        <div className="cl-spec-col">
          <div className="cl-stepper-row">
            <span className="cl-row__title">Eating out</span>
            <Stepper label="Eating out" max={400} onValueChange={setBudget} value={budget} />
          </div>
          <p aria-live="polite" className="cl-note">
            {budget >= 400
              ? "That is the most this budget allows."
              : `About ${formatAmount(budget / 4)} a week.`}
          </p>
        </div>
      </Specimen>
      <Specimen
        name="Dropzone"
        note="For receipts and statements. Drop files on it or press it to pick."
      >
        <div className="cl-spec-col">
          <Dropzone hint="JPG, PNG or PDF, up to 10 MB" label="Add receipts" onFiles={setFiles} />
          <p aria-live="polite" className="cl-note">
            {files.length > 0 ? `Added ${files.join(", ")}` : "No files yet."}
          </p>
        </div>
      </Specimen>
    </>
  );
};
