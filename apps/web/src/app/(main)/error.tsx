"use client";

import { useEffect } from "react";
import { Button } from "@repo/ui/components/button";

interface ErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

const Error = ({ error, retry }: ErrorProps) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground">This page failed to load.</p>
      </div>
      <Button onClick={retry}>Try again</Button>
    </main>
  );
};

export default Error;
