import { CircleCheck, CircleX, Info, TriangleExclamationPoint } from "lucide-react";
import type { ReactNode } from "react";

const ICON = {
  fail: CircleX,
  info: Info,
  ok: CircleCheck,
  warn: TriangleExclamationPoint,
} as const;

/** An outcome that needs a sentence: the tint and the word carry it together. */
export const Alert = ({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: keyof typeof ICON;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) => {
  const Icon = ICON[tone];

  return (
    <div
      className="v-alert"
      data-tone={tone === "info" ? undefined : tone}
      role={tone === "fail" ? "alert" : "status"}
    >
      <Icon aria-hidden />
      <div className="v-stack-sm v-gap-2 v-grow">
        <p className="v-alert-title">{title}</p>
        {Boolean(children) && <div className="v-t1">{children}</div>}
      </div>
      {action}
    </div>
  );
};
