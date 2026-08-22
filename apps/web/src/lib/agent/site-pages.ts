import { siteConfig } from "@/lib/site-config";

/**
 * The prose pages, authored once and rendered twice: as JSX by
 * `(main)/(app)/<page>/page.tsx` and as Markdown by the content-negotiated
 * `/api/markdown` handler. Keeping one source stops the two representations
 * from drifting — an agent reading the Markdown gets the same words a person
 * reads in the browser.
 */

export type ProseListItem = {
  label: string;
  /** When present the label renders as a link. */
  href?: string;
  /** Trailing note, rendered after an em dash. */
  text?: string;
};

export type ProseBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "list"; items: ProseListItem[] };

export type ProsePage = {
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
};

export const aboutPage: ProsePage = {
  path: "/about",
  heading: "A curated collection of components that spark joy.",
  title: "About",
  description:
    "What UICapsule is, who makes it, and how the components are built, licensed, and installed.",
  sitemapPriority: 0.6,
  blocks: [
    {
      kind: "paragraph",
      text: "Over the years I've built and collected UI pieces that are thoughtfully crafted, interactive concepts that feel natural, and creative design experiments.",
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
      kind: "list",
      items: [
        {
          label: "Install with the shadcn CLI",
          text: `run \`npx shadcn@latest add ${siteConfig.url}/r/<slug>.json\``,
        },
        {
          label: "Browse the registry index",
          href: "/r/registry.json",
          text: "every component, with its dependencies",
        },
        {
          label: "Read the source",
          href: siteConfig.repository,
          text: "the whole gallery is open source on GitHub",
        },
        {
          label: "License",
          text: "MIT — use the components in personal and commercial work, no attribution required",
        },
      ],
    },
  ],
};

export const contactPage: ProsePage = {
  path: "/contact",
  heading: "Get in touch.",
  title: "Contact",
  description: `How to reach ${siteConfig.name} — email, GitHub issues, and social.`,
  sitemapPriority: 0.5,
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
      kind: "list",
      items: [
        {
          label: siteConfig.email,
          href: `mailto:${siteConfig.email}`,
          text: "general enquiries, licensing, privacy requests",
        },
        {
          label: "GitHub issues",
          href: `${siteConfig.repository}/issues`,
          text: "bugs, broken components, feature requests",
        },
        {
          label: `${siteConfig.twitter} on X`,
          href: "https://x.com/kaiyuhsu",
          text: "new components as they ship",
        },
      ],
    },
  ],
};

export const privacyPage: ProsePage = {
  path: "/privacy",
  heading: "Privacy.",
  title: "Privacy",
  description: `What ${siteConfig.name} collects, what it stores, and who it shares data with.`,
  sitemapPriority: 0.4,
  blocks: [
    {
      kind: "paragraph",
      text: "Browsing the gallery requires no account, sets no advertising cookies, and runs no third-party trackers. Nothing on this site is sold, rented, or shared with data brokers.",
    },
    { kind: "heading", text: "What is collected" },
    {
      kind: "list",
      items: [
        {
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
          text: "component cover videos are served from Supabase storage, so playing one is a request to that host",
        },
      ],
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
      kind: "list",
      items: [
        {
          label: "Vercel",
          href: "https://vercel.com/legal/privacy-policy",
          text: "hosting and analytics",
        },
        {
          label: "Turso",
          href: "https://turso.tech/privacy",
          text: "the database behind accounts",
        },
        {
          label: "Supabase",
          href: "https://supabase.com/privacy",
          text: "storage for cover videos",
        },
      ],
    },
    {
      kind: "paragraph",
      text: `Questions about any of this go to ${siteConfig.email}.`,
    },
  ],
};

export const inspirationPage: ProsePage = {
  path: "/inspiration",
  heading: "Other inspirations",
  title: "Inspiration",
  description: "Places worth looking at beyond this gallery. In progress.",
  sitemapPriority: 0.3,
  blocks: [{ kind: "paragraph", text: "[IN PROGRESS]" }],
};

/** Prose pages, in the order they should appear in a sitemap or llms.txt. */
export const prosePages: ProsePage[] = [aboutPage, contactPage, privacyPage, inspirationPage];

/**
 * Routes that render HTML but carry no prose worth a full Markdown page. They
 * still need *a* Markdown representation: a URL that answers 200 to a browser
 * and 404 to an agent would be a lie about what exists.
 */
export const utilityPages: ProsePage[] = [
  {
    path: "/auth/login",
    heading: "Log in",
    title: "Login",
    description: "Sign in to a UICapsule account.",
    blocks: [
      {
        kind: "paragraph",
        text: "An interactive sign-in form. Accounts are optional — every component in the gallery is readable, installable, and downloadable without one.",
      },
    ],
  },
  {
    path: "/auth/register",
    heading: "Create an account",
    title: "Register",
    description: "Create a UICapsule account.",
    blocks: [
      {
        kind: "paragraph",
        text: "An interactive sign-up form. Accounts are optional — nothing in the gallery is gated behind one.",
      },
    ],
  },
  {
    path: "/auth/password-reset",
    heading: "Reset your password",
    title: "Password reset",
    description: "Request a UICapsule password reset link.",
    blocks: [{ kind: "paragraph", text: "An interactive form that emails a password reset link." }],
  },
  {
    path: "/auth/password-update",
    heading: "Choose a new password",
    title: "Password update",
    description: "Set a new UICapsule password from a reset link.",
    blocks: [
      {
        kind: "paragraph",
        text: "An interactive form for setting a new password from a reset link.",
      },
    ],
  },
];

export const findPageByPath = (pathname: string): ProsePage | null =>
  [...prosePages, ...utilityPages].find((page) => page.path === pathname) ?? null;
