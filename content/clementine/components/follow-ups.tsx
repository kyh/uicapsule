import "./follow-ups.css";

export const FollowUps = ({
  items,
  onPick,
}: {
  items: readonly string[];
  onPick: (item: string) => void;
}) => (
  <ul aria-label="Suggested replies" className="cl-followups">
    {items.map((item) => (
      <li key={item}>
        <button className="cl-chip" onClick={() => onPick(item)} type="button">
          {item}
        </button>
      </li>
    ))}
  </ul>
);
