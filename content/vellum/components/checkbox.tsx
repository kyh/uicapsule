import type { ReactNode } from "react";

/** One yes-or-no item whose tick draws in left to right. */
export const Checkbox = ({
  checked,
  onCheckedChange,
  children,
  strike = false,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: ReactNode;
  strike?: boolean;
}) => (
  <label className="v-check" data-done={strike && checked ? "" : undefined}>
    <input
      checked={checked}
      onChange={(event) => {
        onCheckedChange(event.target.checked);
      }}
      type="checkbox"
    />
    <span aria-hidden className="v-check-box">
      <svg fill="none" viewBox="0 0 12 12">
        <path
          d="M2.5 6.2 5 8.6l4.6-5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
        />
      </svg>
    </span>
    <span className="v-check-label">{children}</span>
  </label>
);
