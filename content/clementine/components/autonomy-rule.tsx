import { useId } from "react";

import "./autonomy-rule.css";

interface AutonomyRuleProps {
  before?: string;
  after?: string;
  value: string;
  onValueChange: (value: string) => void;
  kind?: "amount" | "number";
  disabled?: boolean;
}

export const AutonomyRule = ({
  before,
  after,
  value,
  onValueChange,
  kind = "amount",
  disabled = false,
}: AutonomyRuleProps) => {
  const id = useId();

  const label = [before, kind === "amount" ? `${value} dollars` : value, after]
    .filter(Boolean)
    .join(" ");

  return (
    <p className="cl-rule" data-disabled={disabled || undefined}>
      {before !== undefined && before !== "" ? (
        <span className="cl-rule__words">{before}</span>
      ) : null}
      <label className="cl-rule__field" htmlFor={id}>
        {kind === "amount" ? <span aria-hidden>$</span> : null}
        <input
          aria-label={label}
          disabled={disabled}
          id={id}
          inputMode={kind === "amount" ? "decimal" : "numeric"}
          onChange={(event) => {
            onValueChange(
              event.target.value.replaceAll(kind === "amount" ? /[^0-9.]/gu : /[^0-9]/gu, ""),
            );
          }}
          size={Math.max(1, value.length)}
          value={value}
        />
      </label>
      {after !== undefined && after !== "" ? <span className="cl-rule__words">{after}</span> : null}
    </p>
  );
};
