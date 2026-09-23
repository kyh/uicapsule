import type { ReactNode } from "react";
import type { Metadata } from "next";

import { MotionProvider } from "@/components/motion-provider";
import { ThemeProvider } from "@/components/theme-provider";

import "../styles/globals.css";

// Bare iframe targets; /ui/<slug> is the indexable page.
export const metadata: Metadata = { robots: { follow: false, index: false } };

const FrameLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en" className="h-full" suppressHydrationWarning>
    <body className="bg-background text-foreground font-sans antialiased h-full">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <MotionProvider>{children}</MotionProvider>
      </ThemeProvider>
    </body>
  </html>
);

export default FrameLayout;
