import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { Search } from "lucide-react";

import { Kbd } from "./badge";
import { Icon } from "./icon";

interface FieldIds {
  id: string;
  describedBy: string | undefined;
  invalid: boolean;
}

interface FieldProps {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: (ids: FieldIds) => ReactNode;
}

/** Label, control, then one line under it: the hint, or the error that replaces it. */
export const Field = ({ label, hint, error, optional, children }: FieldProps) => {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error ?? hint;

  return (
    <div className="fj-field">
      <label className="fj-field-label" htmlFor={id}>
        {label}
        {optional ? <span> optional</span> : null}
      </label>
      {children({ describedBy: note ? noteId : undefined, id, invalid: Boolean(error) })}
      {note ? (
        <p className={error ? "fj-field-error" : "fj-field-hint"} id={noteId}>
          {note}
        </p>
      ) : null}
    </div>
  );
};

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  mono?: boolean;
}

export const TextField = ({ label, hint, error, optional, mono, ...props }: TextFieldProps) => (
  <Field error={error} hint={hint} label={label} optional={optional}>
    {({ id, describedBy, invalid }) => (
      <input
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className="fj-input"
        data-mono={mono ? "" : undefined}
        id={id}
        {...props}
      />
    )}
  </Field>
);

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const TextArea = ({ label, hint, error, ...props }: TextAreaProps) => (
  <Field error={error} hint={hint} label={label}>
    {({ id, describedBy, invalid }) => (
      <textarea
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className="fj-input"
        id={id}
        {...props}
      />
    )}
  </Field>
);

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  shortcut?: string;
}

export const SearchInput = ({ label, shortcut, ...props }: SearchInputProps) => (
  <div className="fj-input-wrap">
    <Icon icon={Search} />
    <input aria-label={label} className="fj-input" type="search" {...props} />
    {shortcut ? <Kbd>{shortcut}</Kbd> : null}
  </div>
);
