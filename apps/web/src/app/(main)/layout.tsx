import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { GlobalAlertDialog } from "@repo/ui/components/alert-dialog";
import { Toaster } from "@repo/ui/components/toast";
import { TooltipProvider } from "@repo/ui/components/tooltip";

import { MotionProvider } from "@/components/motion-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "@/lib/site-config";
import { ORPCReactProvider } from "@/orpc/react";

import "../styles/globals.css";

const monoFont = localFont({
  src: "../styles/mono.woff2",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  description: siteConfig.description,
  icons: [
    {
      rel: "icon",
      sizes: "96x96",
      type: "image/png",
      url: `${siteConfig.url}/favicon/favicon-96x96.png`,
    },
    {
      rel: "icon",
      type: "image/svg+xml",
      url: `${siteConfig.url}/favicon/favicon.svg`,
    },
    {
      rel: "shortcut icon",
      url: `${siteConfig.url}/favicon/favicon.ico`,
    },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      url: `${siteConfig.url}/favicon/apple-touch-icon.png`,
    },
    {
      rel: "manifest",
      url: `${siteConfig.url}/favicon/site.webmanifest`,
    },
  ],
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    description: siteConfig.description,
    images: [
      {
        height: 1080,
        url: `${siteConfig.url}/og.jpg`,
        width: 1920,
      },
    ],
    locale: "en-US",
    siteName: siteConfig.name,
    title: siteConfig.name,
    type: "website",
    url: siteConfig.url,
  },
  other: {
    "apple-mobile-web-app-title": siteConfig.shortName,
  },
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  twitter: {
    card: "summary_large_image",
    creator: siteConfig.twitter,
    description: siteConfig.description,
    images: [
      {
        height: 1080,
        url: `${siteConfig.url}/og.jpg`,
        width: 1920,
      },
    ],
    title: siteConfig.name,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { color: "white", media: "(prefers-color-scheme: light)" },
    { color: "black", media: "(prefers-color-scheme: dark)" },
  ],
};

interface LayoutProps {
  children: ReactNode;
}

const RootLayout = (props: LayoutProps) => (
  <html lang="en" className={monoFont.variable} suppressHydrationWarning>
    <body className="bg-background text-foreground font-sans antialiased">
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <MotionProvider>
          <TooltipProvider>
            <ORPCReactProvider>{props.children}</ORPCReactProvider>
            <Toaster />
            <GlobalAlertDialog />
          </TooltipProvider>
        </MotionProvider>
      </ThemeProvider>
      <Analytics />
    </body>
  </html>
);

export default RootLayout;
