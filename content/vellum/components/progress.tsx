/** A bar of ink for work under way; omit `value` when the length is unknown. */
export const Progress = ({
  label,
  value,
  size = "md",
}: {
  label: string;
  value?: number;
  size?: "sm" | "md";
}) => (
  <div
    className="v-progress"
    data-done={value === 100 ? "" : undefined}
    data-indeterminate={value === undefined ? "" : undefined}
    data-size={size}
  >
    <progress aria-label={label} className="v-sr" max={100} value={value} />
    <span
      aria-hidden
      className="v-progress-fill"
      style={value === undefined ? undefined : { width: `${value}%` }}
    />
  </div>
);
