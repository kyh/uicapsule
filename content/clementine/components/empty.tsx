import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import "./empty.css";

export const Empty = ({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) => (
  <div className="cl-empty">
    <Icon aria-hidden className="cl-empty__icon" size={24} strokeWidth={1.5} />
    <h4 className="cl-empty__title">{title}</h4>
    <p className="cl-empty__body">{children}</p>
    {action}
  </div>
);
