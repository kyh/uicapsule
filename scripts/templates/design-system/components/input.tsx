import { useId } from "react";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export const Input = ({ label, hint, className = "", ...props }: InputProps) => {
  const id = useId();
  const hintId = `${id}-hint`;
  return (
    <div className={`grid gap-1.5 ${className}`}>
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={hint ? hintId : undefined}
        className="border-input bg-card placeholder:text-muted-foreground focus-visible:outline-ring h-9 rounded-md border-(length:--ds-border-width) px-3 text-sm transition duration-(--ds-duration) focus-visible:outline-2 focus-visible:outline-offset-1"
        id={id}
        {...props}
      />
      {hint ? (
        <p className="text-muted-foreground text-xs" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
};
