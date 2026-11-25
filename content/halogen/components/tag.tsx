import type { ReactNode } from "react";

export type TagTone = "plain" | "ok" | "warn" | "fail" | "wash" | "outline";

/** A small ruled label for a property that does not change mid-run. */
export const Tag = ({ tone = "plain", children }: { tone?: TagTone; children: ReactNode }) => (
  <span className="hx-tag" data-tone={tone === "plain" ? undefined : tone}>
    {children}
  </span>
);

export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="hx-kbd">{children}</kbd>
);

/** Square initials for a person, with their full name for screen readers. */
export const Avatar = ({ name, size }: { name: string; size?: "lg" }) => {
  const initials = name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2);

  return (
    <span className="hx-avatar" data-size={size} title={name}>
      <span aria-hidden>{initials}</span>
      <span className="hx-sr">{name}</span>
    </span>
  );
};

export const AvatarStack = ({ names }: { names: string[] }) => (
  <span className="hx-avatar-stack">
    {names.map((name) => (
      <Avatar key={name} name={name} />
    ))}
  </span>
);
