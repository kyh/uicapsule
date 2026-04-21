import { type ReactNode } from "react";

import { ThemeProvider } from "@/components/theme-provider";

import "../styles/globals.css";

const FrameLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="bg-background text-foreground font-sans antialiased h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
};

export default FrameLayout;
