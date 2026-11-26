import type { ReactNode } from "react";

interface StripProps {
  label: string;
  plain?: boolean;
  children: ReactNode;
}

/** A fieldset of figures on one ruled row; cells with `onSelect` become toggle buttons. */
export const StatusStrip = ({ label, plain, children }: StripProps) => (
  <fieldset aria-label={label} className="hx-strip" data-plain={plain || undefined}>
    {children}
  </fieldset>
);

interface CellProps {
  label: string;
  value: ReactNode;
  unit?: ReactNode;
  lead?: ReactNode;
  selected?: boolean;
  onSelect?: () => void;
}

/** A strip cell: small capitals label above a mono value. */
export const StripCell = ({ label, value, unit, lead, selected, onSelect }: CellProps) => {
  const inner = (
    <>
      <span className="hx-strip-label hx-label-sm">{label}</span>
      <span className="hx-strip-value">
        {lead}
        {value}
        {unit ? <span className="hx-strip-unit">{unit}</span> : null}
      </span>
    </>
  );

  if (onSelect) {
    return (
      <button
        aria-current={selected ? "true" : undefined}
        className="hx-strip-cell"
        onClick={onSelect}
        type="button"
      >
        {inner}
      </button>
    );
  }

  return <div className="hx-strip-cell">{inner}</div>;
};
