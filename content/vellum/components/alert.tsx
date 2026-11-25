import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

export const Alert = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="bg-muted flex gap-3 rounded-[11px] p-3.5 text-[13px]" role="alert">
    <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-(--ds-fail-text)" />
    <div className="grid gap-0.5">
      <p className="text-(--ds-ink) font-medium">{title}</p>
      <div className="text-muted-foreground">{children}</div>
    </div>
  </div>
);
