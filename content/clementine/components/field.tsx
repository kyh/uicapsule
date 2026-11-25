import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

import "./field.css";

interface FieldShellProps {
  label: string;
  description?: string;
  error?: string;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}

export const Field = ({ label, description, error, children }: FieldShellProps) => {
  const id = useId();
  const descId = description ? `${id}-desc` : "";
  const errId = error ? `${id}-err` : "";
  const describedBy = [descId, errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="cl-field">
      <label className="cl-field__label" htmlFor={id}>
        {label}
      </label>
      {children({ describedBy, id, invalid: Boolean(error) })}
      {description ? (
        <p className="cl-field__desc" id={descId}>
          {description}
        </p>
      ) : null}
      {error ? (
        <p className="cl-field__error" id={errId}>
          {error}
        </p>
      ) : null}
    </div>
  );
};

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
  prefix?: string;
}

export const Input = ({ label, description, error, prefix, ...props }: InputProps) => (
  <Field description={description} error={error} label={label}>
    {({ id, describedBy, invalid }) => (
      <span className="cl-input" data-invalid={invalid || undefined}>
        {prefix ? (
          <span aria-hidden className="cl-input__prefix">
            {prefix}
          </span>
        ) : null}
        <input
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          id={id}
          {...props}
        />
      </span>
    )}
  </Field>
);

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  description?: string;
}

export const Textarea = ({ label, description, ...props }: TextareaProps) => (
  <Field description={description} label={label}>
    {({ id, describedBy }) => (
      <textarea aria-describedby={describedBy} className="cl-textarea" id={id} {...props} />
    )}
  </Field>
);
