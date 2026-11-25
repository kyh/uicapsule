import type { ReactNode } from "react";

export type Kind = "run" | "agent" | "repo" | "secret";

export const KINDS = ["run", "agent", "repo", "secret"] as const satisfies readonly Kind[];

export const KIND_WORD = {
  agent: "Agent",
  repo: "Repo",
  run: "Run",
  secret: "Secret",
} satisfies Record<Kind, string>;

interface BadgeProps {
  kind?: Kind;
  trouble?: "warn" | "fail";
  variant?: "ghost";
  children?: ReactNode;
}

/** A static label: a kind as a tinted word, a trouble attribute, or a plain grey tag. */
export const Badge = ({ kind, trouble, variant, children }: BadgeProps) => (
  <span className="fj-badge" data-kind={kind} data-trouble={trouble} data-variant={variant}>
    {children ?? (kind ? KIND_WORD[kind] : null)}
  </span>
);

/** Something a person pastes elsewhere: a run id, a branch, a path. Mono and ink. */
export const CodeTag = ({ children, trouble }: { children: ReactNode; trouble?: "fail" }) => (
  <code className="fj-code-tag" data-trouble={trouble}>
    {children}
  </code>
);

export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="fj-kbd">{children}</kbd>
);
