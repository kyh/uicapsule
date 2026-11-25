import type { ReactNode } from "react";

/** Nothing here yet: a light glyph, a title and the one way forward. */
export const EmptyState = ({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) => (
  <div className="v-empty">
    {icon}
    <p className="v-heading-sm">{title}</p>
    <p className="v-body-sm v-t2 v-empty-text">{children}</p>
    {action ? <div className="v-empty-action">{action}</div> : null}
  </div>
);
