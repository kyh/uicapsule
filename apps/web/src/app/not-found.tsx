import Link from "next/link";
import { Button } from "@repo/ui/components/button";

import "./styles/globals.css";

// The app has multiple root layouts (one per route group under (frame)/(main)),
// so the global not-found has no root layout to render into and must supply its
// own <html>/<body> and stylesheet.
const NotFound = () => (
  <html lang="en" suppressHydrationWarning>
    <body className="bg-background text-foreground font-sans antialiased">
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-medium">404</p>
          <h1 className="text-2xl font-semibold">Page not found</h1>
          <p className="text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has moved.
          </p>
        </div>
        <Button render={<Link href="/" />}>Back home</Button>
      </main>
    </body>
  </html>
);

export default NotFound;
