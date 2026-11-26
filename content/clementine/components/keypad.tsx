import { Delete } from "lucide-react";
import type { KeyboardEvent } from "react";

import "./keypad.css";

type Key = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "." | "del";

const KEYS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  ".",
  "0",
  "del",
] as const satisfies readonly Key[];

const KEY_OF_EVENT = new Map<string, Key>([
  ...KEYS.filter((key) => /^[0-9]$/u.test(key)).map((key) => [key, key] as const),
  [",", "."],
  [".", "."],
  ["Backspace", "del"],
]);

const KEY_LABEL: Partial<Record<Key, string>> = { ".": "Decimal point", del: "Delete" };

/** Applies one key to the typed amount string: two decimals at most, no second point, no leading zero. */
export const pressKey = (value: string, key: Key, { decimal = true, maxDigits = 7 } = {}) => {
  if (key === "del") {
    return value.slice(0, -1);
  }

  if (key === ".") {
    if (!decimal || value.includes(".")) {
      return value;
    }

    return value === "" ? "0." : `${value}.`;
  }

  const [whole = "", cents] = value.split(".");

  if (cents !== undefined) {
    return cents.length >= 2 ? value : `${value}${key}`;
  }

  if (whole === "0") {
    return key;
  }

  return whole.length >= maxDigits ? value : `${value}${key}`;
};

interface KeypadProps {
  value: string;
  onValueChange: (value: string) => void;
  decimal?: boolean;
  disabled?: boolean;
}

export const Keypad = ({ value, onValueChange, decimal = true, disabled = false }: KeypadProps) => {
  const press = (key: Key) => {
    onValueChange(pressKey(value, key, { decimal }));
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const key = KEY_OF_EVENT.get(event.key);

    if (key && !disabled) {
      event.preventDefault();
      press(key);
    }
  };

  return (
    <fieldset className="cl-keypad">
      <legend className="cl-sr">Amount keypad</legend>
      {KEYS.map((key) => {
        if (key === "." && !decimal) {
          return <span aria-hidden className="cl-keypad__blank" key={key} />;
        }

        return (
          <button
            aria-label={KEY_LABEL[key]}
            className="cl-keypad__key"
            disabled={disabled}
            key={key}
            onClick={() => {
              press(key);
            }}
            onKeyDown={onKeyDown}
            type="button"
          >
            {key === "del" ? <Delete aria-hidden size={22} strokeWidth={1.75} /> : key}
          </button>
        );
      })}
    </fieldset>
  );
};
