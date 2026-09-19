import { siteConfig } from "@/lib/site-config";

/**
 * The prose pages, authored once and rendered twice: as JSX by
 * `(main)/(app)/<page>/page.tsx` and as Markdown by the content-negotiated
 * `/api/markdown` handler. Keeping one source stops the two representations
 * from drifting — an agent reading the Markdown gets the same words a person
 * reads in the browser.
 */

export interface ProseListItem {
  label: string;
  /** When present the label renders as a link. */
  href?: string;
  /** Trailing note, rendered after an em dash. */
  text?: string;
}

/**
 * Whether an href has to be a plain `<a>` rather than a `next/link`.
 *
 * True for anything off-site, and for the on-site URLs that are route handlers
 * rather than App Router pages — `/llms.txt`, `/sitemap.xml`, `/r/*.json`, any
 * `.md`. The client router would fetch an RSC payload for those, get Markdown,
 * XML or JSON back, and have to fall back to a full page load; prefetch on
 * hover would pull the whole file down for nothing.
 *
 * A trailing file extension is the test, because that is exactly what separates
 * this site's route handlers from its pages.
 */
export const rendersOutsideRouter = (href: string): boolean => {
  if (!href.startsWith("/")) {
    return true;
  }
  const lastSegment = href.split(/[?#]/u)[0]?.split("/").pop() ?? "";
  return lastSegment.includes(".");
};

export type ProseBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "list"; items: ProseListItem[] };

export interface ProsePage {
  /** Route path, also the canonical URL suffix and the sitemap entry. */
  path: string;
  /** Rendered as the page's single `<h1>` and as the Markdown `#` heading. */
  heading: string;
  /** `<title>` and `og:title` (the layout appends the site name). */
  title: string;
  /** `<meta name="description">`, the llms.txt note, and the Markdown summary. */
  description: string;
  /** `<priority>` in sitemap.xml. Omitted for pages the sitemap leaves out. */
  sitemapPriority?: number;
  blocks: ProseBlock[];
}

export const aboutPage: ProsePage = {
  blocks: [
    {
      kind: "paragraph",
      text: "Over the years I've built and collected UI pieces that are thoughtfully crafted, interactive concepts that feel natural, and creative design experiments.",
    },
    {
      kind: "paragraph",
      text: "These days I build them with an AI. I set the brief and hold the taste; it does the heavy lifting; we go back and forth until it feels right.",
    },
    {
      kind: "paragraph",
      text: "This is that collection as open source, copy paste-able code.",
    },
    {
      kind: "paragraph",
      text: "Every entry in the gallery is a self-contained React component. It renders live in the browser rather than as a screenshot, so what you see on the grid is the component actually running. Open one and you get the full source, the dependencies it needs, and a download of the files — nothing is hidden behind a paywall or an account.",
    },
    {
      kind: "paragraph",
      text: "The bar for inclusion is deliberately narrow. A component earns a slot when it imports an interaction from outside the web — hardware, operating-system motion, physical mechanisms, instruments — or when it collides one familiar interaction with an unexpected domain. It has to read from motion alone: if the idea needs a paragraph of explanation before it lands, it isn't ready.",
    },
    {
      kind: "paragraph",
      text: "The stack is React 19, Next.js, Tailwind CSS and Motion, with Base UI underneath the primitives. Components are distributed as a shadcn registry, so you can install one straight into your own project instead of copying files by hand.",
    },
    { kind: "heading", text: "Using the components" },
    {
      items: [
        {
          href: "/r/registry.json",
          label: "Install with the shadcn CLI",
          text: `run \`npx shadcn@latest add ${siteConfig.url}/r/<slug>.json\``,
        },
        {
          label: "Browse the registry index",
          text: "every component, with its dependencies",
        },
        {
          href: siteConfig.repository,
          label: "Read the source",
          text: "the whole gallery is open source on GitHub",
        },
        {
          href: `mailto:${siteConfig.email}`,
          label: "License",
          text: "MIT — use the components in personal and commercial work, no attribution required",
        },
      ],
      kind: "list",
    },
  ],
  description:
    "What UICapsule is, who makes it, and how the components are built, licensed, and installed.",
  heading: "A curated collection of components that spark joy.",
  path: "/about",
  sitemapPriority: 0.6,
  title: "About",
};

export const contactPage: ProsePage = {
  blocks: [
    {
      kind: "paragraph",
      text: `${siteConfig.name} is built and maintained by ${siteConfig.author.name}. There is no support desk and no contact form — email and GitHub are the two channels, and both reach the same person.`,
    },
    {
      kind: "paragraph",
      text: "Email is best for anything private: licensing questions, a component you'd like to see built, press, or a request to remove data associated with an account you created here. Expect a reply within a few business days.",
    },
    {
      kind: "paragraph",
      text: "For anything about the code itself — a component that renders wrong, a broken registry item, a dependency that won't install, or a proposal for a new entry in the gallery — open a GitHub issue instead. Bug reports and feature requests both have templates, and keeping them public means the next person who hits the same thing can find the answer.",
    },
    { kind: "heading", text: "Channels" },
    {
      items: [
        {
          href: `mailto:${siteConfig.email}`,
          label: siteConfig.email,
          text: "general enquiries, licensing, privacy requests",
        },
        {
          href: `${siteConfig.repository}/issues`,
          label: "GitHub issues",
          text: "bugs, broken components, feature requests",
        },
        {
          href: "https://x.com/kaiyuhsu",
          label: `${siteConfig.twitter} on X`,
          text: "new components as they ship",
        },
      ],
      kind: "list",
    },
  ],
  description: `How to reach ${siteConfig.name} — email, GitHub issues, and social.`,
  heading: "Get in touch.",
  path: "/contact",
  sitemapPriority: 0.5,
  title: "Contact",
};

export const privacyPage: ProsePage = {
  blocks: [
    {
      kind: "paragraph",
      text: "Browsing the gallery requires no account, sets no advertising cookies, and runs no third-party trackers. Nothing on this site is sold, rented, or shared with data brokers.",
    },
    { kind: "heading", text: "What is collected" },
    {
      items: [
        {
          href: "https://vercel.com/legal/privacy-policy",
          label: "Analytics",
          text: "Vercel Analytics records aggregate page views. It sets no cookies and builds no cross-site profile of you",
        },
        {
          label: "Server logs",
          text: "the site is hosted on Vercel, whose edge network keeps short-lived request logs including IP address and user agent",
        },
        {
          label: "Theme preference",
          text: "your light/dark choice is kept in your browser's local storage and never leaves the device",
        },
        {
          label: "Media",
          text: "component covers are served from a Vercel Blob store, so playing one is a request to that host",
        },
      ],
      kind: "list",
    },
    { kind: "heading", text: "Accounts" },
    {
      kind: "paragraph",
      text: "Accounts are optional and nothing in the gallery is gated behind one. If you do create one, the database stores your name, your email address, a hashed password, and a session record that includes the IP address and user agent the session was created from. Sessions are cookie-based; the cookie exists to keep you signed in and does nothing else. Passwords are never stored in plain text.",
    },
    {
      kind: "paragraph",
      text: `Email ${siteConfig.email} to have an account and its sessions deleted, and it will be removed along with everything attached to it.`,
    },
    { kind: "heading", text: "Processors" },
    {
      items: [
        {
          label: "Vercel",
          text: "hosting and analytics",
        },
        {
          href: "https://turso.tech/privacy",
          label: "Turso",
          text: "the database behind accounts",
        },
        {
          href: "https://vercel.com/legal/privacy-policy",
          label: "Vercel",
          text: "the Blob store behind component covers",
        },
      ],
      kind: "list",
    },
    {
      kind: "paragraph",
      text: `Questions about any of this go to ${siteConfig.email}.`,
    },
  ],
  description: `What ${siteConfig.name} collects, what it stores, and who it shares data with.`,
  heading: "Privacy.",
  path: "/privacy",
  sitemapPriority: 0.4,
  title: "Privacy",
};

/** Prose pages, in the order they should appear in a sitemap or llms.txt. */
export const prosePages: ProsePage[] = [aboutPage, contactPage, privacyPage];

/**
 * Routes that render HTML but carry no prose worth a full Markdown page. They
 * still need *a* Markdown representation: a URL that answers 200 to a browser
 * and 404 to an agent would be a lie about what exists.
 */
export const utilityPages: ProsePage[] = [
  {
    blocks: [
      {
        kind: "paragraph",
        text: "An interactive sign-in form. Accounts are optional — every component in the gallery is readable, installable, and downloadable without one.",
      },
    ],
    description: "Sign in to a UICapsule account.",
    heading: "Log in",
    path: "/auth/login",
    title: "Login",
  },
  {
    blocks: [
      {
        kind: "paragraph",
        text: "An interactive sign-up form. Accounts are optional — nothing in the gallery is gated behind one.",
      },
    ],
    description: "Create a UICapsule account.",
    heading: "Create an account",
    path: "/auth/register",
    title: "Register",
  },
  {
    blocks: [{ kind: "paragraph", text: "An interactive form that emails a password reset link." }],
    description: "Request a UICapsule password reset link.",
    heading: "Reset your password",
    path: "/auth/password-reset",
    title: "Password reset",
  },
  {
    blocks: [
      {
        kind: "paragraph",
        text: "An interactive form for setting a new password from a reset link.",
      },
    ],
    description: "Set a new UICapsule password from a reset link.",
    heading: "Choose a new password",
    path: "/auth/password-update",
    title: "Password update",
  },
];

export const findPageByPath = (pathname: string): ProsePage | null =>
  [...prosePages, ...utilityPages].find((page) => page.path === pathname) ?? null;
