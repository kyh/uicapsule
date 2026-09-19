"use client";

import type { ComponentProps, ReactNode } from "react";
import { createContext, memo, use, useMemo } from "react";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";
import { cn } from "cn";
import { BrainIcon, DotIcon } from "lucide-react";

const Collapsible = CollapsiblePrimitive.Root;
const CollapsibleTrigger = CollapsiblePrimitive.Trigger;
const CollapsibleContent = CollapsiblePrimitive.Panel;

interface ChainOfThoughtContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ChainOfThoughtContext = createContext<ChainOfThoughtContextValue | null>(null);

const useChainOfThought = () => {
  const context = use(ChainOfThoughtContext);
  if (!context) {
    throw new Error("ChainOfThought components must be used within ChainOfThought");
  }
  return context;
};

export type ChainOfThoughtProps = ComponentProps<"div"> & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const ChainOfThoughtRoot = ({
  className,
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: ChainOfThoughtProps) => {
  const [isOpen, setIsOpen] = useControllableState({
    defaultProp: defaultOpen,
    onChange: onOpenChange,
    prop: open,
  });

  const contextValue = useMemo(() => ({ isOpen, setIsOpen }), [isOpen, setIsOpen]);

  return (
    <ChainOfThoughtContext.Provider value={contextValue}>
      <div className={cn("not-prose max-w-prose space-y-4", className)} {...props}>
        {children}
      </div>
    </ChainOfThoughtContext.Provider>
  );
};

export const ChainOfThought = memo(ChainOfThoughtRoot);

export type ChainOfThoughtHeaderProps = ComponentProps<typeof CollapsibleTrigger>;

const ChainOfThoughtHeaderBase = ({ className, children, ...props }: ChainOfThoughtHeaderProps) => {
  const { isOpen, setIsOpen } = useChainOfThought();

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <CollapsibleTrigger
        className={cn(
          "text-(--muted-foreground) flex w-full items-center gap-2 text-sm transition-colors",
          className,
        )}
        {...props}
      >
        <BrainIcon className="size-4" />
        <span className="flex-1 text-left">{children ?? "Chain of Thought"}</span>
      </CollapsibleTrigger>
    </Collapsible>
  );
};

export const ChainOfThoughtHeader = memo(ChainOfThoughtHeaderBase);

const stepStatusStyles = {
  active: "text-emerald-600",
  complete: "text-(--muted-foreground)",
  pending: "text-(--muted-foreground)/50",
};

export type ChainOfThoughtStepProps = ComponentProps<"div"> & {
  icon?: ReactNode;
  label: string;
  status?: keyof typeof stepStatusStyles;
};

const ChainOfThoughtStepBase = ({
  className,
  icon,
  label,
  status = "complete",
  children,
  ...props
}: ChainOfThoughtStepProps) => (
  <div
    className={cn(
      "flex gap-2 text-sm",
      stepStatusStyles[status],
      "fade-in-0 slide-in-from-top-2 animate-in",
      className,
    )}
    {...props}
  >
    <div className="relative mt-0.5">
      {icon ?? <DotIcon className="size-4" />}
      <div className="bg-(--border) absolute top-7 bottom-0 left-1/2 -mx-px w-px" />
    </div>
    <div className="flex-1 space-y-2">
      <div>{label}</div>
      {children}
    </div>
  </div>
);

export const ChainOfThoughtStep = memo(ChainOfThoughtStepBase);

export type ChainOfThoughtContentProps = ComponentProps<typeof CollapsibleContent>;

const ChainOfThoughtContentBase = ({
  className,
  children,
  ...props
}: ChainOfThoughtContentProps) => {
  const { isOpen } = useChainOfThought();

  return (
    <Collapsible open={isOpen}>
      <CollapsibleContent
        className={cn(
          "mt-2 space-y-3",
          "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-(--popover-foreground) data-[state=closed]:animate-out data-[state=open]:animate-in outline-none",
          className,
        )}
        {...props}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

export const ChainOfThoughtContent = memo(ChainOfThoughtContentBase);

ChainOfThought.displayName = "ChainOfThought";
ChainOfThoughtHeader.displayName = "ChainOfThoughtHeader";
ChainOfThoughtStep.displayName = "ChainOfThoughtStep";
ChainOfThoughtContent.displayName = "ChainOfThoughtContent";
