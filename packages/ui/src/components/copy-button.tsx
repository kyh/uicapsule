"use client";

import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { cn } from "cn";

import { Button } from "./button";

export type CopyButtonProps = Omit<ComponentProps<typeof Button>, "value"> & {
  value: string | undefined;
  label?: string;
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CopyButton = ({
  value,
  label = "Copy",
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const resetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimeout.current !== null) {
        clearTimeout(resetTimeout.current);
      }
    },
    [],
  );

  const copyToClipboard = async () => {
    if (!navigator.clipboard?.writeText || value === undefined) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setIsCopied(true);
      onCopy?.();

      if (resetTimeout.current !== null) {
        clearTimeout(resetTimeout.current);
      }

      resetTimeout.current = setTimeout(() => {
        setIsCopied(false);
      }, timeout);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  };

  return (
    <Button
      className={cn("shrink-0", className)}
      onClick={() => {
        void copyToClipboard();
      }}
      size="icon"
      variant="ghost"
      aria-label={isCopied ? "Copied" : label}
      {...props}
    >
      {children ?? (
        <span className="text-muted-foreground relative inline-block size-3.5">
          <CopyIcon
            size={14}
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-out",
              isCopied ? "scale-25 opacity-0 blur-[4px]" : "blur-0 scale-100 opacity-100",
            )}
          />
          <CheckIcon
            size={14}
            className={cn(
              "absolute inset-0 transition-all duration-300 ease-out",
              isCopied ? "blur-0 scale-100 opacity-100" : "scale-25 opacity-0 blur-[4px]",
            )}
          />
        </span>
      )}
    </Button>
  );
};
