import { type ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { GlobalAlertDialog } from "@repo/ui/components/alert-dialog";
import { Toaster } from "@repo/ui/components/toast";
import { TooltipProvider } from "@repo/ui/components/tooltip";

import { MotionProvider } from "@/components/motion-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { pageOpenGraph } from "@/lib/agent/page-metadata";
import { siteConfig } from "@/lib/site-config";
import { ORPCReactProvider } from "@/orpc/react";

import "../styles/globals.css";

const monoFont = localFont({
  src: "../styles/mono.woff2",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  creator: siteConfig.author.name,
  publisher: siteConfig.name,
  category: "technology",
  keywords: [
    "React components",
    "UI components",
    "shadcn registry",
    "Tailwind CSS",
    "interaction design",
    "motion design",
    "open source",
  ],
  openGraph: pageOpenGraph("/"),
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [
      {
        url: `${siteConfig.url}/og.jpg`,
        width: 1920,
        height: 1080,
      },
    ],
    creator: siteConfig.twitter,
  },
  icons: [
    {
      rel: "icon",
      type: "image/png",
      sizes: "96x96",
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
  other: {
    "apple-mobile-web-app-title": siteConfig.shortName,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

type LayoutProps = {
  children: ReactNode;
};

const RootLayout = (props: LayoutProps) => {
  return (
    <html lang="en" className={monoFont.variable} suppressHydrationWarning>
      <body className="bg-background text-foreground font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
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
};

export default RootLayout;
