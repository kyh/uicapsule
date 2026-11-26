import { Search } from "lucide-react";
import { useState } from "react";

import { Field, Input, Textarea } from "../components/field";
import { Icon } from "../components/icon";
import { Group, Sheet, SpecCell } from "../components/page";
import { groupHead } from "./catalog";
import { Select } from "../components/select";

const REGIONS = [
  { label: "eu-central-1", meta: "Frankfurt", value: "eu-central-1" },
  { label: "eu-west-2", meta: "London", value: "eu-west-2" },
  { label: "us-east-1", meta: "Virginia", value: "us-east-1" },
  { label: "ap-southeast-2", meta: "Sydney", value: "ap-southeast-2" },
] as const;

type Region = (typeof REGIONS)[number]["value"];

const CRON = /^(?<min>\S+)\s+(?<hour>\S+)\s+(?<dom>\S+)\s+(?<mon>\S+)\s+(?<dow>\S+)$/u;

export const Inputs = () => {
  const [name, setName] = useState("orders_nightly");
  const [cron, setCron] = useState("0 2 * *");
  const [region, setRegion] = useState<Region>("eu-central-1");
  const [notes, setNotes] = useState("Skip partitions older than 90 days.");

  const cronError = CRON.test(cron.trim())
    ? undefined
    : "A schedule needs five fields: minute, hour, day, month, weekday.";

  return (
    <Group {...groupHead("inputs")}>
      <Sheet>
        <SpecCell
          edge
          name="Field and Input"
          note="A capitals label, one plain hint, and when it fails, an error that says what would fix it."
          path="inputs/field"
        >
          <Field hint="Lowercase, numbers and underscores." label="Pipeline name">
            {({ id, describedBy }) => (
              <Input
                aria-describedby={describedBy}
                id={id}
                mono
                onChange={(event) => {
                  setName(event.target.value);
                }}
                value={name}
              />
            )}
          </Field>
          <Field error={cronError} hint="Runs in UTC." label="Schedule">
            {({ id, describedBy, invalid }) => (
              <Input
                aria-describedby={describedBy}
                aria-invalid={invalid}
                id={id}
                mono
                onChange={(event) => {
                  setCron(event.target.value);
                }}
                value={cron}
              />
            )}
          </Field>
          <Input
            aria-label="Search tables"
            lead={<Icon icon={Search} />}
            placeholder="Search 1,138 tables"
          />
        </SpecCell>
        <SpecCell
          name="Select"
          note="The native select, dressed as a field. The keyboard behaves exactly as the platform does."
          path="inputs/select"
        >
          <Select label="Region" onValueChange={setRegion} options={[...REGIONS]} value={region} />
          <p className="hx-caption hx-ink-3">
            New warehouses start in <code>{region}</code>.
          </p>
        </SpecCell>
        <SpecCell
          edge
          name="Textarea"
          note="Free text from a person. It resizes only when they drag the corner."
          path="inputs/textarea"
        >
          <Field hint={`${notes.length} / 280`} label="Run note">
            {({ id, describedBy }) => (
              <Textarea
                aria-describedby={describedBy}
                id={id}
                maxLength={280}
                onChange={(event) => {
                  setNotes(event.target.value);
                }}
                value={notes}
              />
            )}
          </Field>
        </SpecCell>
        <SpecCell
          name="Disabled field"
          note="Recessed fill and off ink. It is exempt from contrast, so it never carries something a person has to read."
          path="inputs/field"
        >
          <Field hint="Set by the workspace owner." label="Retention">
            {({ id, describedBy }) => (
              <Input aria-describedby={describedBy} disabled id={id} mono value="400 days" />
            )}
          </Field>
        </SpecCell>
      </Sheet>
    </Group>
  );
};
