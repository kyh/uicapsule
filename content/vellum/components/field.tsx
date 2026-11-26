import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  hideLabel?: boolean;
}

/** A one-line field: a pill whose hairline darkens to a third of ink on focus. */
export const Field = ({ label, hint, error, icon, hideLabel = false, ...props }: FieldProps) => {
  const id = useId();
  const hintId = hint !== undefined && hint !== "" ? `${id}-hint` : undefined;
  const describedBy = error !== undefined && error !== "" ? `${id}-error` : hintId;

  return (
    <div className="v-field-wrap">
      <label className={hideLabel ? "v-sr" : undefined} htmlFor={id}>
        {label}
      </label>
      <div className="v-field" data-invalid={error !== undefined && error !== "" ? "" : undefined}>
        {icon}
        <input
          aria-describedby={describedBy}
          aria-invalid={error !== undefined && error !== "" ? true : undefined}
          id={id}
          {...props}
        />
      </div>
      {error !== undefined && error !== "" ? (
        <p className="v-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
      {hint !== undefined && hint !== "" && (error === undefined || error === "") ? (
        <p className="v-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
};

/** A multi-line input with the 10px corner, because a pill would crop long text. */
export const Textarea = ({
  label,
  hint,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) => {
  const id = useId();

  return (
    <div className="v-field-wrap">
      <label htmlFor={id}>{label}</label>
      <textarea
        aria-describedby={hint !== undefined && hint !== "" ? `${id}-hint` : undefined}
        className="v-textarea"
        id={id}
        {...props}
      />
      {hint !== undefined && hint !== "" ? (
        <p className="v-hint" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
};
