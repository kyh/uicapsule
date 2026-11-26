import { ChevronDown } from "lucide-react";
import { useId } from "react";
import type { ReactNode } from "react";

import "./accordion.css";

export const AccordionItem = ({
  title,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) => {
  const id = useId();

  return (
    <div className="cl-acc" data-open={open || undefined}>
      <h4 className="cl-acc__heading">
        <button
          aria-controls={id}
          aria-expanded={open}
          className="cl-acc__trigger"
          onClick={() => {
            onOpenChange(!open);
          }}
          type="button"
        >
          {title}
          <ChevronDown aria-hidden size={16} strokeWidth={1.75} />
        </button>
      </h4>
      <div className="cl-acc__panel" id={id} inert={!open}>
        <div className="cl-acc__inner">{children}</div>
      </div>
    </div>
  );
};
