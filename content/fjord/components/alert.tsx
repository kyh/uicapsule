import type { ReactNode } from "react";
import { OctagonAlert } from "lucide-react";

export const Alert = ({ title, children }: { title: string; children: ReactNode }) => (
  <div
    className="border-border bg-card flex gap-3 rounded-(--ds-radius-frame) border-(length:--ds-border-width) p-4 text-sm"
    role="alert"
  >
    <OctagonAlert aria-hidden className="text-destructive mt-0.5 size-4 shrink-0" />
    <div className="grid gap-1">
      <p className="font-[440]">{title}</p>
      <div className="text-muted-foreground">{children}</div>
    </div>
  </div>
);
