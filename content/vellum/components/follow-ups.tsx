import { CornerDownRight } from "lucide-react";

/** Suggested next questions in the asker's own words; each sends when pressed. */
export const FollowUps = ({
  items,
  onSelect,
  disabled = false,
}: {
  items: readonly string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
}) => (
  <ul aria-label="Suggested follow-ups" className="v-stack-sm v-gap-0">
    {items.map((item) => (
      <li key={item}>
        <button
          className="v-fold-trigger"
          disabled={disabled}
          onClick={() => onSelect(item)}
          data-follow-up=""
          type="button"
        >
          <CornerDownRight aria-hidden />
          <span className="v-t1">{item}</span>
        </button>
      </li>
    ))}
  </ul>
);
