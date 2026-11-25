import { initials } from "../lib/format";

interface AvatarProps {
  name: string;
  type?: "person" | "agent";
  size?: "sm" | "lg";
}

/** A circle is someone on the team. An agent sits in the inner corner, tinted by its kind. */
export const Avatar = ({ name, type = "person", size }: AvatarProps) => (
  <span className="fj-avatar" data-size={size} data-type={type} title={name}>
    <span aria-hidden>{type === "agent" ? name.charAt(0) : initials(name)}</span>
    <span className="fj-sr">{type === "agent" ? `${name}, agent` : name}</span>
  </span>
);

export const AvatarGroup = ({ names, label }: { names: string[]; label: string }) => (
  <span className="fj-avatar-group" title={label}>
    {names.map((name) => (
      <Avatar key={name} name={name} />
    ))}
  </span>
);
