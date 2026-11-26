import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

import "./error-state.css";

export const ErrorState = ({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) => (
  <div className="cl-alert" data-tone="danger" role="alert">
    <CircleAlert aria-hidden className="cl-alert__icon" size={16} strokeWidth={2} />
    <div className="cl-alert__body">
      <p className="cl-alert__title">{title}</p>
      <p className="cl-alert__text">{children}</p>
      {action ? <div className="cl-alert__action">{action}</div> : null}
    </div>
  </div>
);
