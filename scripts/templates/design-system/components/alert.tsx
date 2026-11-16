import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

export const Alert = ({ title, children }: { title: string; children: ReactNode }) => (
  <div
    className="border-destructive/40 bg-destructive/5 flex gap-3 rounded-lg border-(length:--ds-border-width) p-4 text-sm"
    role="alert"
  >
    <CircleAlert aria-hidden className="text-destructive mt-0.5 size-4 shrink-0" />
    <div className="grid gap-1">
      <p className="font-medium">{title}</p>
      <div className="text-muted-foreground">{children}</div>
    </div>
  </div>
);
