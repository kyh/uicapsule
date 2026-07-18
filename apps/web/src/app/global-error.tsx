"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Catches errors thrown by a root layout itself, so it replaces the layout
// entirely and must render its own <html>/<body>. Kept dependency-free — the
// providers and fonts the app usually supplies may be exactly what failed.
const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans antialiased">
        <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="text-muted-foreground">The application failed to load.</p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="bg-primary text-primary-foreground hover:bg-primary/80 inline-flex h-9 items-center rounded-md px-4 text-sm font-medium transition-colors"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
};

export default GlobalError;
