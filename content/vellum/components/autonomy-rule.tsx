import { Segmented } from "./segmented";
import { Select } from "./select";

export type Autonomy = "auto" | "ask" | "never";

const LEVELS = [
  { label: "Go ahead", value: "auto" },
  { label: "Ask me", value: "ask" },
  { label: "Never", value: "never" },
] as const satisfies readonly { label: string; value: Autonomy }[];

/** One permission row: an action an agent might take, and whether it goes ahead, asks or never does. */
export const AutonomyRule = ({
  title,
  description,
  value,
  onValueChange,
  control = "segmented",
  disabled = false,
}: {
  title: string;
  description?: string;
  value: Autonomy;
  onValueChange: (value: Autonomy) => void;
  control?: "segmented" | "select";
  disabled?: boolean;
}) => (
  <li className="v-row v-rule-row">
    <div className="v-row-main">
      <span className={`v-label ${disabled ? "v-t2" : ""}`}>{title}</span>
      {description !== undefined && description !== "" ? (
        <span className="v-caption v-t2">{description}</span>
      ) : null}
    </div>
    <div className="v-row-end">
      {control === "segmented" ? (
        <Segmented
          disabled={disabled}
          label={title}
          onValueChange={onValueChange}
          options={LEVELS}
          size="sm"
          value={value}
        />
      ) : (
        <Select
          disabled={disabled}
          label={title}
          onValueChange={onValueChange}
          options={LEVELS}
          size="sm"
          value={value}
        />
      )}
    </div>
  </li>
);
