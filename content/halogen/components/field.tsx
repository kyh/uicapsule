import { CircleAlert } from "lucide-react";
import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

import { Icon } from "./icon";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

/** Wires a label, a control and its hint or error together with matching ids. */
export const Field = ({ label, hint, error, children }: FieldProps) => {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;

  return (
    <div className="hx-field">
      <label className="hx-field-label hx-label-sm" htmlFor={id}>
        {label}
      </label>
      {children({
        describedBy: note !== undefined && note !== "" ? noteId : undefined,
        id,
        invalid: Boolean(error),
      })}
      {error !== undefined && error !== "" ? (
        <p className="hx-field-error hx-caption" id={noteId}>
          <Icon icon={CircleAlert} size={14} />
          {error}
        </p>
      ) : null}
      {(error === undefined || error === "") && hint !== undefined && hint !== "" ? (
        <p className="hx-field-hint hx-caption" id={noteId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
};

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  lead?: ReactNode;
  trail?: ReactNode;
  mono?: boolean;
  fieldSize?: "sm";
}

/** A single-line input inside the field chrome, with optional lead and trail slots. */
export const Input = ({ lead, trail, mono, fieldSize, ...rest }: InputProps) => (
  <span className="hx-input" data-mono={mono === true || undefined} data-size={fieldSize}>
    {lead}
    <input {...rest} />
    {trail}
  </span>
);

export const Textarea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <span className="hx-input" data-multiline>
    <textarea {...props} />
  </span>
);
