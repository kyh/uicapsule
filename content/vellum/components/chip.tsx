import { X } from "lucide-react";
import type { ReactNode } from "react";

/** A toggling filter that darkens when on and never gleams. */
export const FilterChip = ({
  pressed,
  onPressedChange,
  count,
  children,
}: {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
  count?: number;
  children: ReactNode;
}) => (
  <button
    aria-pressed={pressed}
    className="v-chip"
    onClick={() => onPressedChange(!pressed)}
    type="button"
  >
    {children}
    {count === undefined ? null : <span className="v-chip-count">{count}</span>}
  </button>
);

/** A chosen value with its own named remove button. */
export const ValueChip = ({ children, onRemove }: { children: string; onRemove: () => void }) => (
  <span className="v-chip">
    <span className="v-truncate">{children}</span>
    <button aria-label={`Remove ${children}`} className="v-chip-x" onClick={onRemove} type="button">
      <X aria-hidden />
    </button>
  </span>
);

/** A tool, document or team named inside a sentence. */
export const Mention = ({ children }: { children: ReactNode }) => (
  <span className="v-chip" data-mention="">
    {children}
  </span>
);
