/** Initials in an ink wash; never a colour per person. */
export const Avatar = ({ name, size = "md" }: { name: string; size?: "md" | "lg" }) => {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <span className="v-avatar" data-size={size} title={name}>
      <span aria-hidden>{initials}</span>
      <span className="v-sr">{name}</span>
    </span>
  );
};
