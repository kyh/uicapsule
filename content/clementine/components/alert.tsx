import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

export const Alert = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="bg-muted flex gap-3 rounded-2xl p-4 text-sm" role="alert">
    <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-[oklch(0.5_0.19_25)]" />
    <div className="grid gap-1">
      <p className="font-semibold">{title}</p>
      <div className="text-muted-foreground">{children}</div>
    </div>
  </div>
);
