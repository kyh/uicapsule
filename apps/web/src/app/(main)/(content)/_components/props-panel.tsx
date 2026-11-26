import type { ReactNode } from "react";
import { SlidersHorizontalIcon } from "lucide-react";

interface PropsPanelProps {
  action?: ReactNode;
  children?: ReactNode;
}

export const PropsPanel = ({ action, children }: PropsPanelProps) => (
  <div className="flex h-full flex-col">
    {action !== undefined && (
      <div className="flex h-12 shrink-0 items-center justify-end gap-1 px-2">{action}</div>
    )}
    {children ?? (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <SlidersHorizontalIcon aria-hidden className="text-muted-foreground size-5" />
        <p className="text-muted-foreground max-w-56 text-sm text-pretty">
          This component doesn’t expose any props yet.
        </p>
      </div>
    )}
  </div>
);
