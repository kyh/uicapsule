import { siteConfig } from "@/lib/site-config";

/**
 * The prose pages, authored once and rendered twice: as JSX by
 * `(main)/(app)/<page>/page.tsx` and as Markdown by the content-negotiated
 * `/api/markdown` handler. Keeping one source stops the two representations
 * from drifting — an agent reading the Markdown gets the same words a person
 * reads in the browser.
 *
 * Copy is plain text plus the inline markup `inline-markup.ts` defines:
 * `**bold**`, `` `code` `` and `[label](href)`. An href is an app path, an
 * off-site URL, `mailto:`, or an in-page `#anchor` naming a heading's id.
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
 * True for anything that is not an absolute app path — off-site URLs,
 * `mailto:`, in-page `#anchors` — and for the on-site URLs that are route
 * handlers rather than App Router pages — `/llms.txt`, `/sitemap.xml`,
 * `/r/*.json`, any `.md`. The client router would fetch an RSC payload for
 * those, get Markdown, XML or JSON back, and have to fall back to a full page
 * load; prefetch on hover would pull the whole file down for nothing.
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
  /** `level` 2 (the default) is a section, 3 a subsection within one. */
  | { kind: "heading"; text: string; level?: 2 | 3 }
  | { kind: "list"; items: ProseListItem[] }
  /** Sentence bullets: each item is copy, not a label. */
  | { kind: "bullets"; items: string[] }
  /** Every row carries one cell per column. */
  | { kind: "table"; columns: string[]; rows: string[][] }
  | { kind: "divider" };

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

/**
 * A heading's anchor, the way GitHub-flavoured Markdown derives it: lower case,
 * punctuation dropped, each space a hyphen. The HTML page sets the same id, so
 * an `#anchor` link works in both representations.
 */
export const slugifyHeading = (text: string): string =>
  text
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "")
    .replaceAll(" ", "-");

/**
 * One id per heading block (`undefined` for every other block), unique across
 * the page: a repeated heading takes `-1`, `-2`… in document order, as a
 * Markdown renderer numbers them. `taken` seeds ids already in use above the
 * blocks, such as the page's own `<h1>`.
 */
export const headingIdsFor = (
  blocks: ProseBlock[],
  taken: string[] = [],
): (string | undefined)[] => {
  const used = new Set(taken);
  const claim = (text: string): string => {
    const base = slugifyHeading(text);
    let id = base;
    for (let suffix = 1; used.has(id); suffix += 1) {
      id = `${base}-${suffix}`;
    }
    used.add(id);
    return id;
  };
  return blocks.map((block) => (block.kind === "heading" ? claim(block.text) : undefined));
};

/** Heading ids for a whole page, aligned with `page.blocks`. */
export const headingIds = (page: ProsePage): (string | undefined)[] =>
  headingIdsFor(page.blocks, [slugifyHeading(page.heading)]);

const p = (text: string): ProseBlock => ({ kind: "paragraph", text });
const h2 = (text: string): ProseBlock => ({ kind: "heading", text });
const h3 = (text: string): ProseBlock => ({ kind: "heading", level: 3, text });
const bullets = (...items: string[]): ProseBlock => ({ items, kind: "bullets" });
const table = (columns: string[], rows: string[][]): ProseBlock => ({
  columns,
  kind: "table",
  rows,
});
const divider: ProseBlock = { kind: "divider" };

/** An in-page link to a section, labelled with the section's own heading. */
const anchorTo = (heading: string): string => `[${heading}](#${slugifyHeading(heading)})`;

/**
 * A linked index of the top-level sections in `blocks`. The ids are worked out
 * against the page heading, as `headingIds` does, so each entry lands on the
 * section it names; a test holds every `#anchor` on a page to that.
 */
const sectionIndex = (pageHeading: string, blocks: ProseBlock[]): ProseBlock => {
  const ids = headingIdsFor(blocks, [slugifyHeading(pageHeading)]);
  return {
    items: blocks.flatMap((block, index) =>
      block.kind === "heading" && block.level !== 3
        ? [{ href: `#${ids[index] ?? slugifyHeading(block.text)}`, label: block.text }]
        : [],
    ),
    kind: "list",
  };
};

export const aboutPage: ProsePage = {
  blocks: [
    {
      kind: "paragraph",
      text: "Mostly interactions the web doesn't have yet, borrowed from phones, hardware, and physical objects.",
    },
    {
      kind: "paragraph",
      text: "Over the years I've built and collected UI pieces that caught my eye: thoughtfully crafted details, interactive concepts that feel natural, design experiments that never found a home.",
    },
    {
      kind: "paragraph",
      text: "UICapsule grew out of that collection. What started as a private stash is now open source. Every component installs with a single shadcn command, and agents can find them through the MCP server.",
    },
    {
      kind: "paragraph",
      text: "If there's an interaction you wish existed, [request it](/request). The best ideas come from somewhere other than the web.",
    },
  ],
  description: "Why UICapsule exists and who makes it.",
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

/*
 * The Privacy Policy and the Terms of Use follow General Legal's templates
 * (the GDPR-enhanced privacy policy and the website terms of use, JAMS
 * arbitration), adapted so every sentence describes what this codebase does.
 * When the code changes what it collects, keeps or shares, the policy changes
 * in the same commit.
 */

const LEGAL_DATE = "October 3, 2026";

const EMAIL = `[${siteConfig.email}](mailto:${siteConfig.email})`;

const GENERAL_LEGAL_CREDIT =
  'This template was prepared and made publicly available by General Legal, PC ("General Legal"). It is provided for general reference purposes only and does not constitute, and should not be construed as, legal advice, or an endorsement or review of any particular transaction in which it is used. Use of this template does not create an attorney-client relationship with General Legal. General Legal has not reviewed, and takes no position on, any modifications made to this document or the deal terms it is used to document.';

/** The privacy policy's top-level sections, named once for the index and cross-references. */
const privacySection = {
  changes: "Changes to this Privacy Policy",
  children: "Children",
  choices: "Your choices",
  collect: "Personal information we collect",
  contact: "How to contact us",
  europe: "Notice to European users",
  otherSites: "Other sites and services",
  retention: "Retention",
  security: "Security",
  share: "How we share your personal information",
  state: "State privacy rights notice",
  tracking: "Tracking & Other Technologies",
  transfer: "International data transfer",
  use: "How we use your personal information",
};

const PRIVACY_HEADING = "Privacy Policy";

/** The recipients nearly every category of personal information may reach. */
const DISCLOSED_TO =
  "Service providers; Professional advisors; Authorities and others; Business transferees";

const privacySections: ProseBlock[] = [
  h2(privacySection.collect),
  p(
    "**Information you provide to us.** Personal information you may provide to us through the Service or otherwise includes:",
  ),
  bullets(
    "**Contact data**, such as your email address and, if you give it, your name.",
    '**Profile data**, such as the email address and password that you set to establish an online account on the Service, and your display name, which the sign-up form sets to the part of your email address before the "@". We store your password only in hashed form, never in plain text.',
    "**Communications data** based on our exchanges with you, including when you contact us by email.",
    "**User-generated content and input data**, such as the component requests you file through the Service: the name of the component, a description of what it does, links to where you saw it, the name and link you give for credit, and any images or videos you attach, as well as associated metadata. Metadata includes information on how, when, where and by whom a piece of content was collected and how that content has been formatted or edited. Metadata also includes information that users can add or can have added to their content, such as keywords, geographical or location information, and other similar data. Files you attach are uploaded as you provide them, with their file names and any metadata they contain, as soon as you add them to the form, even if you do not go on to file the request.",
    "**Other data** not specifically listed here, which we will use as described in this Privacy Policy or as otherwise disclosed at the time of collection.",
  ),
  p(
    "**Third-party sources.** We may combine personal information we receive from you with personal information falling within one of the categories identified above that we obtain from other sources, such as:",
  ),
  bullets(
    "**Public sources**, such as social media platforms and other publicly available sources. For example, a component's page credits, by name and link, the people and projects whose published work inspired it.",
    "**Service providers** that provide services on our behalf or help us operate the Service or our business.",
  ),
  p(
    "**Automatic data collection.** We and our service providers may automatically log information about you, your computer or mobile device, and your interaction over time with the Service, such as:",
  ),
  bullets(
    "**Device data**, such as your computer or mobile device's operating system type and version, browser type and version, device type (e.g., phone, tablet), IP address, and general location information such as city, state or geographic area.",
    "**Online activity data**, such as pages you viewed, the website you visited before browsing to the Service, access times, and the searches and component lookups an AI agent makes through our MCP server, including the text of each search.",
  ),
  p(
    `For more information concerning our automatic collection of data, please see the ${anchorTo(privacySection.tracking)} section below.`,
  ),
  p(
    "**Data about others.** The links and files in a component request may identify other people, such as the designer of an interaction you saw. Please do not share other people's personal information with us, beyond links to work they have published, unless you have their permission to do so.",
  ),

  h2(privacySection.tracking),
  p(
    "**Cookies and other technologies.** Some of our automatic data collection is facilitated by cookies and other technologies. These are all that the Service uses, by category:",
  ),
  bullets(
    "**Essential.** If you sign in, we set a first-party cookie that keeps you signed in. Sessions are cookie-based; the cookie exists to keep you signed in and does nothing else. If you block or delete it, you are signed out and cannot sign in, but every other part of the Service still works.",
    "**Functionality / performance.** If you pick a light, dark or system theme, your choice is kept in your browser's local storage, a form of browser web storage that we set as a first party. It never leaves your device. If you clear it, the Service follows your device's theme.",
    "**Analytics.** We use Vercel Web Analytics, provided by Vercel, to record page views for aggregate statistics. It is served from the Service's own domain, sets no cookies and builds no cross-site profile of you: Vercel identifies a visitor by a hash created from the incoming request rather than by a cookie, and discards it after 24 hours (see [Vercel's Web Analytics privacy documentation](https://vercel.com/docs/analytics/privacy-policy)). When an AI agent searches for or looks up a component through our MCP server, we record the search text, or the component looked up, as a Vercel Web Analytics event too. A content blocker can block Vercel Web Analytics without affecting the Service.",
  ),
  p(
    "We do not use advertising or social media cookies, and the Service runs no third-party trackers.",
  ),
  p(
    "**Content from other hosts.** Component covers and other media are served from our Vercel Blob store, so playing one is a request to that host. Component previews run in your browser, and some of them also load content from other hosts: photos from Unsplash, and the model files that a camera-based preview downloads from jsDelivr and Google Cloud Storage when you start it. One gallery entry, Line Chart, is embedded from covid-19.kyh.io, a separate site. A component page that credits a requester whose link is a GitHub profile shows their GitHub profile picture, loaded from GitHub. Loading content from these other hosts sends your IP address and browser information to them, and each handles it under its own privacy policy.",
  ),
  p(
    "**Camera.** One component preview can use your camera, if you allow it in your browser, to count your arm movements. The video is processed on your device and is not sent to us or to anyone else.",
  ),
  p(
    '**Chat and other artificial intelligence ("AI") technologies**, such as those provided by Anthropic, that we use to build the components you request through the Service. Anthropic and other third parties may access and use the contents of your component requests, including their text, links, credit and attached files, to facilitate the provision of the Service.',
  ),
  p(
    `For information concerning your choices with respect to the use of tracking technologies, see the ${anchorTo(privacySection.choices)} section below.`,
  ),

  h2(privacySection.use),
  p(
    "We may use your personal information for the following purposes or as otherwise described at the time of collection:",
  ),
  p("**Service delivery and operations.** We may use your personal information to:"),
  bullets(
    "provide the Service;",
    "enable security features of the Service;",
    "establish and maintain your user profile on the Service;",
    "publish the component requests you file as public issues in our GitHub repository, build the components you request, and credit you on them as you ask;",
    "communicate with you about the Service, including by sending password reset emails, Service-related announcements and updates, and support and administrative messages; and",
    "provide support for the Service, and respond to your requests, questions and feedback.",
  ),
  p(
    "**Service personalization**, which may include using your personal information to remember your selections and preferences as you navigate webpages, such as your choice of theme.",
  ),
  p(
    "**Service improvement and analytics.** We may use your personal information to analyze your usage of the Service, improve the Service, improve the rest of our business, help us understand user activity on the Service, including which pages are most and least visited and which components AI agents search for, and to develop new products and services. For example, we use Vercel Web Analytics for this purpose.",
  ),
  p("**Compliance and protection.** We may use your personal information to:"),
  bullets(
    "comply with applicable laws, lawful requests, and legal process, such as to respond to subpoenas, investigations or requests from government authorities;",
    "protect our, your or others' rights, privacy, safety or property (including by making and defending legal claims);",
    "audit our internal processes for compliance with legal and contractual requirements or our internal policies;",
    "enforce the terms and conditions that govern the Service; and",
    "prevent, identify, investigate and deter fraudulent, harmful, unauthorized, unethical or illegal activity, including cyberattacks and identity theft.",
  ),
  p(
    `**Data sharing in the context of corporate events**, we may share certain personal information in the context of actual or prospective corporate events – for more information, see ${anchorTo(privacySection.share)}, below.`,
  ),
  p(
    "**To create aggregated, de-identified and/or anonymized data.** We may create aggregated, de-identified and/or anonymized data from your personal information and other individuals whose personal information we collect. We make personal information into de-identified and/or anonymized data by removing information that makes the data identifiable to you and we will not attempt to reidentify any such data. We may use this aggregated, de-identified and/or anonymized data and share it with third parties for our lawful business purposes, including analyzing and improving the Service and promoting our business.",
  ),
  p(
    "**Further uses**, in some cases, we may use your personal information for further uses, in which case we will ask for your consent to use your personal information for those further purposes if they are not compatible with the initial purpose for which information was collected.",
  ),

  h2(privacySection.retention),
  p(
    "We generally retain personal information to fulfill the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements, establishing or defending legal claims, or for fraud prevention purposes. To determine the appropriate retention period for personal information, we may consider factors such as the amount, nature, and sensitivity of the personal information, the potential risk of harm from unauthorized use or disclosure of your personal information, the purposes for which we process your personal information and whether we can achieve those purposes through other means, and the applicable legal requirements.",
  ),
  p(
    "When we no longer require the personal information we have collected about you, we may either delete it, anonymize it, or isolate it from further processing.",
  ),
  p("Specifically:"),
  bullets(
    "Your account, including its display name, email address and hashed password, is kept until you ask us to delete it. Deleting it removes it along with everything attached to it, including its sessions.",
    "Each session record, including the IP address and user agent the session was created from, is deleted when you sign out, when you reset your password, or when your account is deleted.",
    "A password reset link expires one hour after it is sent and works only once.",
    "Rate-limit counters for the sign-in, sign-up and other account endpoints are keyed by IP address. Each expires after a window of at most one minute, and expired counters are deleted as those endpoints continue to be used.",
    "Component requests stay public on GitHub until they are edited or deleted. If we build a component from your request, the credit you gave stays on its page while the component is published, and remains in the history of our public repository.",
    "Vercel keeps short-lived request logs, including IP addresses and user agents, and discards the hash that identifies a visitor to Vercel Web Analytics after 24 hours.",
    "Your theme preference stays in your browser until you clear it.",
    "We never store your password in plain text, and we never receive the video a camera-based preview processes.",
  ),

  h2(privacySection.share),
  p(
    "We may share your personal information with the following parties (or as otherwise described in this Privacy Policy, in other applicable notices, or at the time of collection). We do not sell or rent your personal information, or share it with advertisers or data brokers.",
  ),
  p(
    "**Service providers.** Third parties that provide services on our behalf or help us operate the Service or our business (such as hosting, information technology, AI providers, email delivery and website analytics). Ours are:",
  ),
  {
    items: [
      {
        href: "https://vercel.com/legal/privacy-notice",
        label: "Vercel",
        text: "hosts the Service and keeps its request logs, provides Vercel Web Analytics, and runs the Vercel Blob store that serves component covers and other media",
      },
      {
        href: "https://turso.tech/privacy-policy",
        label: "Turso",
        text: "hosts the database behind accounts",
      },
      {
        href: "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement",
        label: "GitHub",
        text: "publishes component requests as issues in our public repository, stores the files attached to them, and hosts our source code",
      },
      {
        href: "https://resend.com/legal/privacy-policy",
        label: "Resend",
        text: "delivers password reset emails",
      },
      {
        href: "https://www.anthropic.com/legal/privacy",
        label: "Anthropic",
        text: "provides the AI coding tools we use to build requested components",
      },
    ],
    kind: "list",
  },
  p(
    "**Third parties designated by you.** We may share your personal information with third parties where you have instructed us or provided your consent to do so.",
  ),
  p(
    "**Professional advisors.** Professional advisors, such as lawyers, auditors, bankers and insurers, in the course of the professional services that they render to us.",
  ),
  p(
    "**Authorities and others.** Law enforcement, government authorities, and private parties, as we believe in good faith to be necessary or appropriate for the Compliance and protection purposes described above.",
  ),
  p(
    "**Business transferees.** We may disclose personal information in the context of actual or prospective business transactions (e.g., investments in UICapsule, financing of UICapsule, or the sale, transfer or merger of all or part of UICapsule or its assets). For example, we may need to share certain personal information with prospective counterparties and their advisers. We may also disclose your personal information to an acquirer, successor, or assignee of UICapsule as part of any merger, acquisition, sale of assets, or similar transaction, and/or in the event of an insolvency, bankruptcy, or receivership in which personal information is transferred to one or more third parties as one of our business assets.",
  ),
  p(
    "**Other users and the public.** Your user-generated content and input data is visible to other users of the Service and the public. The component requests you file, including the files you attach and the name and link you give for credit, are published as public issues in our GitHub repository, and if we build a component from your request, its page shows that name and link and, where the link is a GitHub profile, your GitHub profile picture. This information can be seen, collected and used by others, including being cached, copied, screen captured or stored elsewhere by others (e.g., search engines), and we are not responsible for any such use of this information. Your account information is never shown to other users.",
  ),

  h2(privacySection.choices),
  p(
    "In this section, we describe the rights and choices available to all users. Users who are located in certain U.S. states and Europe can find additional information about their rights below.",
  ),
  p(
    `**Access or update your information.** If you have registered for an account with us through the Service, you may review the display name and email address on it by logging into the account and opening the profile menu. To change your password, use the password reset form or email us; to update anything else, email us at ${EMAIL}.`,
  ),
  p(
    "**Cookies and other technologies.** Most browsers let you remove or reject cookies. To do this, follow the instructions in your browser settings. Many browsers accept cookies by default until you change your settings. If you set your browser to disable cookies, you will not be able to sign in or stay signed in, but every other part of the Service works without them. You can also clear your browser's local storage to remove your theme preference, and block Vercel Web Analytics with a content blocker without affecting the Service.",
  ),
  p(
    "**Camera access.** A component preview can use your camera only if you allow it in your browser, and you can withdraw that permission in your browser settings at any time.",
  ),
  p(
    '**Do Not Track.** Some Internet browsers may be configured to send "Do Not Track" signals to the online services that you visit. We currently do not respond to "Do Not Track" signals, because the Service does not track you across other websites.',
  ),
  p(
    "**Declining to provide information.** We need to collect personal information to provide certain services. If you do not provide the information we identify as required or mandatory, we may not be able to provide those services.",
  ),
  p(
    `**Delete your content or close your account.** Accounts cannot be deleted from within the Service. If you wish to close your account, email us at ${EMAIL}, and we will delete it along with its sessions and everything else attached to it. Email us as well to have a component request you filed, or your credit on a component, edited or removed. We can edit or delete the GitHub issue; removing a file you attached may also require a request to GitHub.`,
  ),

  h2(privacySection.otherSites),
  p(
    "The Service may contain links to websites, mobile applications, and other online services operated by third parties. In addition, our content may be integrated into web pages or other online services that are not associated with us. These links and integrations are not an endorsement of, or representation that we are affiliated with, any third party. We do not control websites, mobile applications or online services operated by third parties, and we are not responsible for their actions. We encourage you to read the privacy policies of the other websites, mobile applications and online services you use. If you open an issue on GitHub yourself, for example with our component request template, what you post is public and GitHub's privacy statement applies to it.",
  ),

  h2(privacySection.security),
  p(
    "We employ technical, organizational and physical safeguards designed to protect the personal information we collect, including through the service providers that host the Service and its database. For example, we store passwords only in hashed form, never in plain text. However, security risk is inherent in all internet and information technologies and we cannot guarantee the security of your personal information.",
  ),

  h2(privacySection.transfer),
  p(
    "We are based in the United States and may use service providers that operate in other countries. Your personal information may be transferred to the United States or other locations where privacy laws may not be as protective as those in your state, province, or country.",
  ),
  p(
    "Users in Europe should read the important information provided below about transfer of personal information outside of Europe.",
  ),

  h2(privacySection.children),
  p(
    "The Service is not intended for use by anyone under 18 years of age. If you are a parent or guardian of a child from whom you believe we have collected personal information in a manner prohibited by law, please contact us. If we learn that we have collected personal information through the Service from a child without the consent of the child's parent or guardian as required by law, we will comply with applicable legal requirements to delete the information.",
  ),

  h2(privacySection.changes),
  p(
    "We reserve the right to modify this Privacy Policy at any time. If we make material changes to this Privacy Policy, we will notify you by updating the date of this Privacy Policy and posting it on the Service or other appropriate means. Any modifications to this Privacy Policy will be effective upon our posting the modified version (or as otherwise indicated at the time of posting). In all cases, your use of the Service after the effective date of any modified Privacy Policy indicates your acknowledging that the modified Privacy Policy applies to your interactions with the Service and our business.",
  ),

  h2(privacySection.contact),
  p(
    "If you have questions about our practices or if you would like to exercise any privacy related right that may be available to you, please contact us via one of the methods listed below.",
  ),
  bullets(
    `**Email**: ${EMAIL}`,
    `**GitHub**: for questions that involve no personal information, you can also open an issue at [github.com/kyh/uicapsule/issues](${siteConfig.repository}/issues). Issues are public.`,
  ),

  h2(privacySection.state),
  p(
    'Except as otherwise provided, this section applies to residents of U.S. states to the extent they have privacy laws applicable to us that grant their residents the rights described below (collectively the "**State Privacy Laws**").',
  ),
  p(
    "This section describes how we collect, use, and share Personal Information of residents of these states and the rights these users may have with respect to their Personal Information. Please note that not all rights listed below may be afforded to all users and that if you are not a resident of one of these states listed above, you may not be able to exercise these rights. In addition, **we may not be able to process your request if you do not provide us with sufficient detail to allow us to confirm your identity or understand and respond to it. To confirm your identity, we will ask you to send your request from, or confirm it from, the email address associated with your account, or, if you have no account, to tell us enough about your use of the Service, such as the component request you filed, for us to find the information concerned.**",
  ),
  p(
    'For purposes of this section, the term "**Personal Information**" has the meaning given to "personal data", "personal information" or other similar terms and "**Sensitive Personal Information**" has the meaning given to "sensitive personal information," "sensitive data", or other similar terms in the State Privacy Laws, except that in neither case does such term include information exempted from the scope of the State Privacy Laws.',
  ),
  p(
    "**Your privacy rights.** The State Privacy Laws may provide residents with some or all of the rights listed below. However, these rights are not absolute and some State Privacy Laws do not provide these rights to their residents. Therefore, we may decline your request in certain cases as permitted by law.",
  ),
  p(
    "**Information.** You can request the following information about how we have collected and used your Personal Information:",
  ),
  bullets(
    "The categories of Personal Information that we have collected.",
    "The categories of sources from which we collected Personal Information.",
    "The business or commercial purpose for collecting and/or selling Personal Information.",
    "The categories of third parties with which we share Personal Information.",
    "The categories of Personal Information that we sold or disclosed for a business purpose.",
    "The categories of third parties to whom the Personal Information was sold or disclosed for a business purpose.",
  ),
  p(
    "**Access.** You can request a copy of the Personal Information that we have collected about you.",
  ),
  p("**Appeal.** You can appeal our denial of any request validly submitted."),
  p(
    "**Correction.** You can ask us to correct inaccurate Personal Information that we have collected about you.",
  ),
  p(
    "**Deletion.** You can ask us to delete the Personal Information that we have collected from you.",
  ),
  p("**Opt-out.**"),
  bullets(
    "**Opt-out of certain processing for targeted advertising purposes.** We do not process your personal information for targeted advertising purposes.",
    "**Opt-out of or appeal profiling/automated decision making.** We do not use your Personal Information to engage in profiling or to perform automated decision-making that results in significant financial impacts, significant impacts on housing, education, employment, health care, or criminal justice, or similarly significant impacts.",
    "**Opt-out of other sales of personal data.** We do not sell your Personal Information within the meaning of State Privacy Laws.",
  ),
  p(
    "**Consumers under 16.** We do not have actual knowledge that we collect, sell or share the personal information of consumers under 16 years of age.",
  ),
  p(
    "**Sensitive Personal Information.** While we process certain categories of Sensitive Personal Information as described in this Privacy Policy, such as the login credentials for your account, we do not process Sensitive Personal Information for the purpose of inferring characteristics about consumers under the CCPA.",
  ),
  p(
    "**Nondiscrimination.** You are entitled to exercise the rights described above free from discrimination as prohibited by the State Privacy Laws.",
  ),
  p(
    '**Exercising your right to opt-out of the "sale" or "sharing" of your Personal Information.** We do not sell your Personal Information or "share" it for cross-context behavioral advertising, as the State Privacy Laws define those terms, so there is nothing to opt out of. If that ever changes, we will update this Privacy Policy first, offer a way to opt out, and honor Global Privacy Control ("GPC") signals as valid opt-out requests, as required by applicable law.',
  ),
  p(
    `**Exercising other state privacy rights.** You may submit requests to exercise any of the other state privacy rights listed above via email to ${EMAIL}.`,
  ),
  p(
    "**Verification of Identity; Authorized agents.** We may need to verify your identity in order to process your information, access, appeal, correction, or deletion requests and reserve the right to confirm your residency. To verify your identity, we may require government identification, a declaration under penalty of perjury, or other information, where permitted by law.",
  ),
  p(
    "Under some State Privacy Laws, you may enable an authorized agent to make a request on your behalf. However, we may need to verify your authorized agent's identity and authority to act on your behalf. We may require a copy of a valid power of attorney given to your authorized agent pursuant to applicable law. If you have not provided your agent with such a power of attorney, we may ask you to take additional steps permitted by law to verify that your request is authorized, such as by providing your agent with written and signed permission to exercise your State Privacy Laws rights on your behalf, the information we request to verify your identity, and confirmation that you have given the authorized agent permission to submit the request.",
  ),
  p(
    "**Information practices.** The following describes our practices currently and during the past 12 months:",
  ),
  bullets(
    "**Sources and purposes.** We collect all categories of personal information from the sources and use them for the business/commercial purposes described above in the Privacy Policy.",
    "**Retention.** The criteria for deciding how long to retain personal information is generally based on whether such period is sufficient to fulfill the purposes for which we collected it as described in this notice, including complying with our legal obligations.",
    "**Deidentification.** We do not attempt to reidentify deidentified information derived from personal information, except for the purpose of testing whether our deidentification processes comply with applicable law.",
  ),
  p(
    `**Personal information that we collect, use and disclose.** We have summarized the Personal Information we collect, the purposes for which we collect it and the third parties to whom we may disclose it by reference below to both the categories defined in the "${anchorTo(privacySection.collect)}" section of this Privacy Policy above and the categories of Personal Information specified in the CCPA (Cal. Civ. Code §1798.140). This chart describes our practices currently and during the 12 months preceding the effective date of this Privacy Policy. Information you voluntarily provide to us, such as in free-form webforms, may contain other categories of personal information not described below.`,
  ),
  table(
    [
      'Personal Information ("PI") we collect',
      "CCPA statutory category",
      "Purposes",
      'Categories of third parties to whom we "disclose" PI for a business purpose',
      'Categories of third parties to whom we "sell" or "share" PI',
    ],
    [
      [
        "Contact data",
        "Identifiers; California Customer Records",
        "Service delivery and operations; Compliance and protection",
        DISCLOSED_TO,
        "None",
      ],
      [
        "Profile data",
        "Identifiers; California Customer Records; Sensitive personal information (account login credentials)",
        "Service delivery and operations; Compliance and protection",
        DISCLOSED_TO,
        "None",
      ],
      [
        "Communications data",
        "Identifiers; California Customer Records",
        "Service delivery and operations; Compliance and protection",
        DISCLOSED_TO,
        "None",
      ],
      [
        "User-generated content and input data",
        "Identifiers; Audio, electronic, visual or similar information",
        "Service delivery and operations; Compliance and protection",
        "Service providers; Other users and the public; Professional advisors; Authorities and others; Business transferees",
        "None",
      ],
      [
        "Device data",
        "Identifiers; Internet or other electronic network activity information; Geolocation data (general location only)",
        "Service delivery and operations; Service improvement and analytics; Compliance and protection",
        DISCLOSED_TO,
        "None",
      ],
      [
        "Online activity data",
        "Internet or other electronic network activity information",
        "Service delivery and operations; Service improvement and analytics; Compliance and protection",
        DISCLOSED_TO,
        "None",
      ],
    ],
  ),
  p("**Additional information for California residents.**"),
  p(
    `**Shine the light law.** Under California's Shine the Light law (California Civil Code Section 1798.83), California residents may ask companies with whom they have formed a business relationship primarily for personal, family or household purposes to provide the names of third parties to which they have disclosed certain personal information (as defined under the Shine the Light law) during the preceding calendar year for their own direct marketing purposes, and the categories of personal information disclosed. We do not disclose personal information to third parties for their own direct marketing purposes. You may send us requests for this information to ${EMAIL}. In your request, you must include the statement "Shine the Light Request," and provide your first and last name and mailing address and certify that you are a California resident. We reserve the right to require additional information to confirm your identity and California residency. Please note that we will not accept requests via telephone, mail, or facsimile, and we are not responsible for notices that are not labeled or sent properly, or that do not have complete information.`,
  ),
  p(
    `**Additional information for Nevada residents.** Nevada residents have the right to opt-out of the sale of certain personal information for monetary consideration. While we do not currently engage in such sales, if you are a Nevada resident and would like to make a request to opt out of any potential future sales, please email ${EMAIL}.`,
  ),
  p(
    `**Contact Us.** If you have questions or concerns about our privacy policies or information practices, please contact us using the contact details set forth in the ${anchorTo(privacySection.contact)} section above.`,
  ),

  h2(privacySection.europe),
  h3("General"),
  p(
    '**Where this Notice to European users applies.** The information provided in this "Notice to European users" section applies only to individuals in the United Kingdom and the European Economic Area (i.e., "Europe" as defined at the top of this Privacy Policy).',
  ),
  p(
    '**Personal information.** References to "personal information" in this Privacy Policy should be understood to include a reference to "personal data" (as defined in the GDPR) – i.e., information about individuals from which they are either directly identified or can be identified.',
  ),
  h3("Controller"),
  p(
    `Kaiyu Hsu, who provides UICapsule, is the controller in respect of the processing of your personal information covered by this Privacy Policy for purposes of European data protection legislation (i.e., the EU GDPR and the so-called 'UK GDPR' (as and where applicable, the "GDPR")). See the '${anchorTo(privacySection.contact)}' section above for our contact details.`,
  ),
  h3("Our legal bases for processing"),
  p(
    'In respect of each of the purposes for which we use your personal information, the GDPR requires us to ensure that we have a "legal basis" for that use.',
  ),
  p(
    "Our legal bases for processing your personal information described in this Privacy Policy are listed below.",
  ),
  bullets(
    'Where we need to perform a contract we are about to enter into or have entered into with you ("**Contractual Necessity**").',
    'Where it is necessary for our legitimate interests and your interests and fundamental rights do not override those interests ("**Legitimate Interests**"). More detail about the specific legitimate interests pursued in respect of each Purpose we use your personal information for is set out in the table below.',
    'Where we need to comply with a legal or regulatory obligation ("**Compliance with Law**").',
    'Where we have your specific consent to carry out the processing for the Purpose in question ("**Consent**").',
  ),
  p(
    `We have set out below, in a table format, the legal bases we rely on in respect of the relevant Purposes for which we use your personal information – for more information on these Purposes and the data types involved, see '${anchorTo(privacySection.use)}'.`,
  ),
  table(
    ["Purpose", "Categories of personal information involved", "Legal basis"],
    [
      [
        "Service delivery and operations",
        "Contact data; Profile data; Communications data; User-generated content and input data; Device data",
        "Contractual Necessity.",
      ],
      [
        "Security",
        "Contact data; Profile data; Device data; Online activity data",
        "Compliance with Law. Legitimate Interests. We have a legitimate interest in ensuring the ongoing security and proper operation of our Service and associated IT services, systems, and networks.",
      ],
      [
        "Service personalization",
        "Your theme preference, which stays in your browser",
        "Legitimate Interests. We have a legitimate interest in providing you with a good service, which is personalised to you and that remembers your selections and preferences.",
      ],
      [
        "Service improvement and analytics",
        "Device data; Online activity data",
        "Legitimate Interests. We have a legitimate interest in providing you with a good service, and in understanding how the Service is used so that we can improve it.",
      ],
      [
        "Compliance and protection",
        "Any and all data types relevant in the circumstances",
        "Compliance with Law. Legitimate Interests. Where Compliance with Law is not applicable, we and any relevant third parties have a legitimate interest in participating in, supporting, and following legal process and requests, including through co-operation with authorities. We and any relevant third parties may also have a legitimate interest of ensuring the protection, maintenance, and enforcement of our and their rights, property, and/or safety.",
      ],
      [
        "Data sharing in the context of corporate events",
        "Any and all data types relevant in the circumstances",
        "Legitimate Interests. We and any relevant third parties have a legitimate interest in providing information to relevant third parties who are involved in an actual or prospective corporate event (including to enable them to investigate – and, where relevant, to continue to operate – all or relevant part(s) of our operations). However, we would always look to take steps to minimize the amount and sensitivity of any personal information shared in these contexts where possible and appropriate.",
      ],
      [
        "To create aggregated, de-identified and/or anonymized data",
        "Any and all data types relevant in the circumstances",
        "Legitimate Interests. We have a legitimate interest, and believe it is also in your interests, that we are able to take steps to ensure that our Service operates as intended.",
      ],
      [
        "Further uses",
        "Any and all data types relevant in the circumstances",
        "The original legal basis relied upon, if the relevant further use is compatible with the initial purpose for which the personal information was collected. Consent, if the relevant further use is not compatible with the initial purpose for which the personal information was collected.",
      ],
    ],
  ),
  h3("Retention"),
  p(
    "We retain personal information for as long as necessary to fulfil the purposes for which we collected it, including for the purposes of satisfying any legal, accounting, or reporting requirements, establishing or defending legal claims, or for Compliance and protection purposes.",
  ),
  p(
    "To determine the appropriate retention period for personal information, we consider the amount, nature, and sensitivity of the personal information, the potential risk of harm from unauthorized use or disclosure of your personal information, the purposes for which we process your personal information and whether we can achieve those purposes through other means, and the applicable legal requirements.",
  ),
  p(
    "When we no longer require the personal information we have collected about you, we will either delete or anonymize it or, if this is not possible (for example, because your personal information has been stored in backup archives), then we will securely store your personal information and isolate it from any further processing until deletion is possible. If we anonymize your personal information (so that it can no longer be associated with you), we may use this information indefinitely without further notice to you.",
  ),
  h3("Other info"),
  p(
    "**No sensitive personal information.** We ask that you not provide us with any sensitive personal information (e.g., social security numbers, information related to racial or ethnic origin, political opinions, religion or other beliefs, health, biometrics or genetic characteristics, criminal background or trade union membership) on or through the Service, or otherwise to us. If you provide us with any sensitive personal information when you use the Service, you must consent to our processing and use of such sensitive personal information in accordance with this Privacy Policy. If you do not consent to our processing and use of such sensitive personal information, you must not submit such sensitive personal information through the Service.",
  ),
  p(
    "**No Automated Decision-Making and Profiling.** As part of the Service, we do not engage in automated decision-making and/or profiling, which produces legal or similarly significant effects.",
  ),
  h3("Your rights"),
  p(
    "**General.** European data protection laws give you certain rights regarding your personal information. If you are located in Europe, you may ask us to take the following actions in relation to your personal information that we hold:",
  ),
  bullets(
    "**Access.** Provide you with information about our processing of your personal information and give you access to your personal information.",
    "**Correct.** Update or correct inaccuracies in your personal information.",
    "**Delete.** Delete your personal information where there is no good reason for us continuing to process it – you also have the right to ask us to delete or remove your personal information where you have exercised your right to object to processing (see below).",
    "**Transfer.** Transfer a machine-readable copy of your personal information to you or a third party of your choice.",
    "**Restrict.** Restrict the processing of your personal information, for example if you want us to establish its accuracy or the reason for processing it.",
    "**Object.** Object to our processing of your personal information where we are relying on Legitimate Interests – you also have the right to object where we are processing your personal information for direct marketing purposes.",
    "**Withdraw Consent.** When we use your personal information based on your consent, you have the right to withdraw that consent at any time.",
  ),
  p(
    `**Exercising These Rights.** You may submit these requests by email to ${EMAIL}. We may request specific information from you to help us confirm your identity and process your request. Whether or not we are required to fulfill any request you make will depend on a number of factors (e.g., why and how we are processing your personal information), if we reject any request you may make (whether in whole or in part) we will let you know our grounds for doing so at the time, subject to any legal restrictions.`,
  ),
  p(
    "**Your Right to Lodge a Complaint with your Supervisory Authority.** In addition to your rights outlined above, if you are not satisfied with our response to a request you make, or how we process your personal information, you can make a complaint to the data protection regulator in your habitual place of residence.",
  ),
  bullets(
    "For users in the European Economic Area – the contact information for the data protection regulator in your place of residence can be found here: [https://www.edpb.europa.eu/about-edpb/our-members_en](https://www.edpb.europa.eu/about-edpb/our-members_en)",
    "For users in the UK – the contact information for the UK data protection regulator is below: The Information Commissioner's Office, Water Lane, Wycliffe House, Wilmslow – Cheshire SK9 5AF, Tel. +44 303 123 1113, Website: [https://ico.org.uk/make-a-complaint/](https://ico.org.uk/make-a-complaint/)",
  ),
  h3("Data Processing outside Europe"),
  p(
    "We are based in the U.S. and many of our service providers, advisers, partners or other recipients of data are also based in the U.S. This means that, if you use the Service, your personal information will necessarily be accessed and processed in the U.S. It may also be provided to recipients in other countries outside Europe.",
  ),
  p(
    "It is important to note that the U.S. is not the subject of a general 'adequacy decision' under the GDPR – the EU-U.S. Data Privacy Framework and its UK Extension cover only organizations certified under them, and we are not certified. Basically, this means that the U.S. legal regime is not considered by relevant European bodies to provide an adequate level of protection for personal information transferred to us, which is equivalent to that provided by relevant European laws.",
  ),
  p(
    "Where we share your personal information with third parties who are based outside Europe, we try to ensure a similar degree of protection is afforded to it by making sure one of the following mechanisms is implemented:",
  ),
  bullets(
    "**Transfers to territories with an adequacy decision.** We may transfer your personal information to countries or territories whose laws have been deemed to provide an adequate level of protection for personal information by the European Commission or UK Government (as and where applicable) (from time to time).",
    "**Transfers to territories without an adequacy decision.** We may transfer your personal information to countries or territories whose laws have not been deemed to provide such an adequate level of protection (e.g., the U.S., see above). However, in these cases we may use specific appropriate safeguards, which are designed to give personal information effectively the same protection it has in Europe – for example, standard-form contracts approved by relevant authorities for this purpose; or, in limited circumstances, we may rely on an exception, or 'derogation', which permits us to transfer your personal information to such country despite the absence of an 'adequacy decision' or 'appropriate safeguards' – for example, reliance on your explicit consent to that transfer.",
  ),
  p(
    `You may contact us if you want further information on the specific mechanism used by us when transferring your personal information out of Europe. You may have the right to receive a copy of the appropriate safeguards under which your personal information is transferred by contacting us at ${EMAIL}.`,
  ),
];

export const privacyPage: ProsePage = {
  blocks: [
    p(`Effective as of ${LEGAL_DATE}.`),
    p(
      `To view previous versions of this Privacy Policy, see [its history on GitHub](${siteConfig.repository}/commits/main/apps/web/src/lib/agent/site-pages.ts).`,
    ),
    p(
      `**California Notice at Collection/State Privacy Rights Notice**: See the ${anchorTo(privacySection.state)} section below for important information about your rights under applicable state privacy laws.`,
    ),
    p(
      'Kaiyu Hsu ("**UICapsule**," "**we**," "**us**" or "**our**") provides UICapsule, a curated gallery of open-source UI components. This Privacy Policy describes how UICapsule processes personal information that we collect through our digital or online properties or services that link to this Privacy Policy (including, as applicable, our website at www.uicapsule.com, our shadcn component registry and our MCP server) and the other activities described in this Privacy Policy (collectively, the "**Service**").',
    ),
    p(
      `**Notice to European users**: Please see the ${anchorTo(privacySection.europe)} section below for additional information for individuals located in the European Economic Area or United Kingdom (which we refer to as "**Europe**", and "**European**" should be understood accordingly).`,
    ),
    p(
      "You can download a printable copy of this Privacy Policy as plain text at [www.uicapsule.com/privacy.md](/privacy.md).",
    ),
    p("**Index**"),
    sectionIndex(PRIVACY_HEADING, privacySections),
    ...privacySections,
    divider,
    p(GENERAL_LEGAL_CREDIT),
  ],
  description: `How ${siteConfig.name} collects, uses and shares personal information, and the choices and rights you have.`,
  heading: PRIVACY_HEADING,
  path: "/privacy",
  sitemapPriority: 0.4,
  title: PRIVACY_HEADING,
};

export const termsPage: ProsePage = {
  blocks: [
    p(`**Version 1.0 Last revised:** ${LEGAL_DATE}`),
    p(
      'The website located at www.uicapsule.com, together with its shadcn component registry and MCP server (collectively, the "**Site**") is owned and operated by Kaiyu Hsu ("**UICapsule**," "**us**," "**our**," or "**we**"). Certain features of the Site may be subject to additional guidelines or rules posted on the Site, which are incorporated by reference into these Terms.',
    ),
    p(
      'These Terms of Use ("**Terms**") govern your use of the Site. By accessing or using the Site, or by clicking "I agree" (or a similar button or checkbox) when that option is presented to you, you agree to these Terms on behalf of yourself or the entity you represent, and you confirm that you have the authority to do so. You must be at least 18 years old to use the Site. If you do not agree to these Terms, please do not use the Site.',
    ),
    p(
      "**IMPORTANT – PLEASE READ SECTION 11 CAREFULLY.** It contains an agreement to resolve disputes through binding individual arbitration instead of in court, and includes a waiver of class action rights and jury trial rights. You have 30 days to opt out of the arbitration agreement, as further described in Section 11.",
    ),

    h2("1. Accounts"),
    p(
      `1.1 **Creating an Account.** You may register for an account on the Site, although you do not need one to use any part of it. When you register, you agree to provide accurate and complete information and to keep that information current. You can delete your account at any time by emailing us at ${EMAIL}. We may suspend or terminate your account as described in Section 8.`,
    ),
    p(
      "1.2 **Account Security.** You are responsible for keeping your login credentials confidential and for all activity that occurs under your account. If you believe your account has been accessed without your authorization, please notify us immediately. We are not liable for any losses resulting from your failure to keep your credentials secure.",
    ),

    h2("2. Access to the Site"),
    p(
      "2.1 **License.** Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Site for your own personal or internal business purposes.",
    ),
    p(
      "2.2 **Restrictions.** You may not: (i) license, sell, rent, lease, transfer, assign, distribute, or commercially exploit the Site or any content on it; (ii) modify, create derivative works from, disassemble, reverse-compile, or reverse-engineer any part of the Site; (iii) access the Site in order to build a similar or competing product or service; or (iv) copy, reproduce, distribute, republish, download, display, post, or transmit any part of the Site except as expressly permitted by these Terms. All copyright and proprietary notices on the Site must be kept intact on any copies you are permitted to make.",
    ),
    p(
      "2.3 **Changes to the Site.** We may modify, suspend, or discontinue the Site (or any part of it) at any time, with or without notice. We are not liable to you or any third party for any such modification, suspension, or discontinuation.",
    ),
    p(
      "2.4 **No Support Obligation.** We have no obligation to provide you with support or maintenance for the Site.",
    ),
    p(
      "2.5 **Ownership.** All intellectual property rights in the Site and its content – including copyrights, patents, trademarks, and trade secrets – belong to UICapsule or its suppliers, except for Your Content (Section 2.7). These Terms do not transfer any ownership rights to you, except for the limited access rights in Section 2.1. All rights not expressly granted are reserved.",
    ),
    p(
      "2.6 **Feedback.** If you share feedback or suggestions about the Site with us, you grant us a perpetual, irrevocable, worldwide, non-exclusive, fully-paid, royalty-free license to use that feedback freely, in any manner and for any purpose, without attribution. Please do not submit any feedback that you consider proprietary or confidential.",
    ),
    p(
      '2.7 **Your Content.** You can request a component through the Site. A request, including its text, its links, the name and link you give for credit and any files you attach (together, "**Your Content**"), is published as a public issue in our GitHub repository, where anyone can read it, and files you attach are uploaded to GitHub as soon as you add them. You keep any ownership rights you have in Your Content. You grant us a perpetual, irrevocable, worldwide, non-exclusive, fully-paid, royalty-free license to use, reproduce, publish and display Your Content, including on GitHub, to build components based on it, to publish and license those components as we choose, including under the MIT License, and to credit you on them by the name and link you give us. You are responsible for Your Content, and you represent that you have all rights necessary to submit it and to grant this license. Please do not include anything in a request that you want to keep private.',
    ),
    p(
      "2.8 **Permitted Uses.** Notwithstanding Section 2.2, you may (a) use the components published in the gallery, including by installing, copying, modifying and distributing their source code, under the license described in Section 2.9; and (b) access the Site with automated tools, such as crawlers, AI agents and the shadcn command-line tool, including through the machine-readable endpoints we publish for that purpose: our shadcn registry, our MCP server, llms.txt, our sitemap and the Markdown version of each page.",
    ),
    p(
      `2.9 **Open-Source Software.** Source code that we publish under an open-source license, such as the MIT License, is governed by that license, and nothing in these Terms limits your rights under it. These Terms govern the hosted Site. The components in the gallery are published under the MIT License, including the source code you install from our shadcn registry, download as a zip file or read through our MCP server (see the [LICENSE file in our GitHub repository](${siteConfig.repository}/blob/main/LICENSE)), and you may use them in your own projects under that license.`,
    ),

    h2("3. Privacy"),
    p(
      "Your use of the Site is also governed by our Privacy Policy, which is available at [www.uicapsule.com/privacy](/privacy) and is incorporated into these Terms by reference. The Privacy Policy describes the types of personal data and other information we collect from you or your device, how we use that information, and the circumstances under which we may share it with third parties.",
    ),
    p(
      "3.1 **Processing of Personal Data.** By using the Site, you acknowledge that you have read and understand our Privacy Policy and that UICapsule will process your personal data and other information in accordance with the Privacy Policy. If there is a conflict between these Terms and the Privacy Policy with respect to the collection, use, or processing of your personal data, the Privacy Policy will control.",
    ),
    p(
      `3.2 **Cookies and Tracking Technologies.** The Site may use cookies and similar technologies ("**Tracking Technologies**") to collect information about your use of the Site. For details on what Tracking Technologies the Site uses, what information they collect, and how you can manage your preferences, please refer to [the ${privacySection.tracking} section of our Privacy Policy](/privacy#${slugifyHeading(privacySection.tracking)}).`,
    ),

    h2("4. Indemnification"),
    p(
      "You agree to defend, indemnify, and hold harmless UICapsule and its officers, employees, and agents from any claims and reasonable costs or attorneys' fees arising out of (i) your use of the Site, (ii) your violation of these Terms, or (iii) your violation of any applicable law or regulation. We may assume control of the defense of any such claim at your expense, and you agree to cooperate with our defense. You agree not to settle any such claim without our prior written consent. We will make reasonable efforts to notify you promptly of any claim we become aware of.",
    ),

    h2("5. Third-Party Services & Other Users"),
    p(
      '5.1 **Third-Party Services.** The Site may include links to or integrations with third-party websites or services (collectively, "**Third-Party Services**"), such as GitHub, where component requests are published, and the hosts that component previews load content from. We do not control, endorse, or take responsibility for any Third-Party Services. You use all Third-Party Services at your own risk, and you acknowledge and agree that the applicable third party\'s own terms and privacy practices will apply to such use.',
    ),
    p(
      "5.2 **Other Users.** Your interactions with other users of the Site are solely between you and those users. We are not responsible for any loss or harm resulting from those interactions, and we reserve the right, but have no obligation, to get involved in disputes between users.",
    ),
    p(
      '5.3 **Release.** To the fullest extent permitted by law, you release UICapsule and its officers, employees, agents, successors, and assigns from all claims, demands, and damages of any kind arising out of or related to the Site, other users, or Third-Party Services. If you are a California resident, you waive California Civil Code Section 1542, which provides: "A general release does not extend to claims which the creditor or releasing party does not know or suspect to exist in his or her favor at the time of executing the release, which if known by him or her must have materially affected his or her settlement with the debtor or released party."',
    ),

    h2("6. Disclaimers"),
    p(
      'THE SITE IS PROVIDED "AS IS" AND "AS AVAILABLE." TO THE FULLEST EXTENT PERMITTED BY LAW, UICAPSULE AND ITS SUPPLIERS DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SITE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR HARMFUL CODE. WHERE APPLICABLE LAW REQUIRES WARRANTIES, THEY ARE LIMITED TO 90 DAYS FROM YOUR FIRST USE.',
    ),

    h2("7. Limitation of Liability"),
    p(
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW: (A) UICAPSULE AND ITS SUPPLIERS WILL NOT BE LIABLE FOR ANY LOST PROFITS, LOST DATA, COSTS OF SUBSTITUTE PRODUCTS, OR ANY INDIRECT, CONSEQUENTIAL, INCIDENTAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES ARISING FROM OR RELATED TO THESE TERMS OR YOUR USE OF (OR INABILITY TO USE) THE SITE; AND (B) OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING UNDER THESE TERMS IS CAPPED AT THE GREATER OF (i) $50 USD AND (ii) THE AMOUNT PAID TO UICAPSULE BY YOU UNDER THESE TERMS IN THE SIX MONTHS PRIOR TO THE INCIDENT GIVING RISE TO THE CLAIM. THE EXISTENCE OF MULTIPLE CLAIMS DOES NOT INCREASE THIS CAP.",
    ),

    h2("8. Term and Termination"),
    p(
      "These Terms remain in effect while you use the Site. We may suspend or terminate your access (including suspending access to or deleting your account) at any time and for any reason, including if we believe you have violated these Terms. We are not liable to you for any such termination. Upon termination, Sections 2.2 through 2.7, Section 2.9 and Sections 3 through 11 will survive.",
    ),

    h2("9. State-Specific Legal Notices"),
    p(
      "The provisions in this Section 9 apply only to users to the extent such users are subject to the laws of the applicable states identified below. If a provision in this section conflicts with another provision of these Terms, the state-specific provision controls for users subject to that state's laws.",
    ),
    p(
      `9.1 **California.** If you are a California resident, you may report complaints to the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs, at 1625 N. Market Blvd. Suite N112, Sacramento, CA 95834, or by phone at (800) 952-5210. Under California Civil Code Section 1789.3, California users of the Site are entitled to the following specific consumer rights notice: The provider of the Site is Kaiyu Hsu. To file a complaint regarding the Site, or to receive further information regarding use of the Site, contact us at ${EMAIL}. You may also contact the Complaint Assistance Unit at the address and phone number above. If you are a California resident, you may have additional rights under the California Consumer Privacy Act (as amended by the California Privacy Rights Act), including the right to know what personal information we collect, the right to delete your personal information, the right to correct inaccurate personal information, and the right to opt out of the sale or sharing of your personal information. For details on how to exercise these rights, please see our Privacy Policy at [www.uicapsule.com/privacy](/privacy).`,
    ),
    p(
      "9.2 **Colorado.** If you are a Colorado resident, you may have additional rights under the Colorado Privacy Act (CPA), including the right to opt out of the processing of your personal data for purposes of targeted advertising, the sale of personal data, and certain profiling. For details, please see our Privacy Policy.",
    ),
    p(
      "9.3 **Connecticut.** If you are a Connecticut resident, you may have additional rights under the Connecticut Data Privacy Act (CTDPA), including rights of access, correction, deletion, and data portability, as well as the right to opt out of the sale of personal data, targeted advertising, and profiling. For details, please see our Privacy Policy.",
    ),
    p(
      "9.4 **Virginia.** If you are a Virginia resident, you may have additional rights under the Virginia Consumer Data Protection Act (VCDPA), including the right to access, correct, delete, and obtain a copy of your personal data, and the right to opt out of the processing of your personal data for targeted advertising, sale, or profiling. For details, please see our Privacy Policy.",
    ),
    p(
      `9.5 **Nevada.** If you are a Nevada resident, you have the right under Nevada Revised Statutes Chapter 603A to direct us not to sell certain information we have collected or will collect about you. To exercise this right, please contact us at ${EMAIL}.`,
    ),
    p(
      "9.6 **Other States.** If you are a resident of another U.S. state with a comprehensive consumer privacy law, such as Texas, Oregon, Montana, Utah, Iowa, Indiana or Tennessee, you may have similar rights under that law. For details, please see our Privacy Policy.",
    ),

    h2("10. General"),
    p(
      "10.1 **Changes to Terms.** We may update these Terms from time to time. If we make material changes, we may notify you by email (at the address on file) or by a prominent notice on the Site. Your continued use of the Site after notice of changes means you accept the updated Terms.",
    ),
    p(
      "10.2 **Governing Law.** These Terms and any dispute arising out of or related to these Terms or the Site will be governed by and construed in accordance with the laws of the State of California, without regard to its conflict-of-law principles. For any claim or dispute not subject to the arbitration provisions in Section 11, you and UICapsule irrevocably consent to the exclusive jurisdiction and venue of the state and federal courts located in San Francisco County, California. Notwithstanding the foregoing: (a) either party may bring an action in any court of competent jurisdiction for injunctive or other equitable relief to protect its intellectual property rights (including patents, copyrights, trademarks, and trade secrets); and (b) either party may bring an individual action in small claims court for claims within that court's jurisdictional limits.",
    ),
    p(
      "10.3 **Export.** You agree not to export, re-export, or transfer any technical data or products acquired from the Site in violation of U.S. export control laws or applicable regulations in other countries.",
    ),
    p(
      "10.4 **Electronic Communications.** By using the Site, you consent to receiving communications from us electronically (by email or notices posted on the Site). These electronic communications satisfy any legal requirement for written notice.",
    ),
    p(
      `10.5 **Accessibility.** UICapsule is committed to making the Site accessible to all users, including individuals with disabilities. We endeavor to conform to the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA, as published by the World Wide Web Consortium (W3C). If you experience any difficulty accessing or navigating the Site, or if you have suggestions for improving accessibility, please contact us at ${EMAIL}. We will make reasonable efforts to address accessibility concerns promptly.`,
    ),
    p(
      '10.6 **Entire Agreement.** These Terms (together with the Privacy Policy and any other policies or guidelines referenced herein) are the entire agreement between you and UICapsule regarding your use of the Site. If any provision of these Terms is found to be invalid or unenforceable, it will be modified to the minimum extent necessary to be valid, and the remaining provisions will continue in effect. Our failure to enforce any provision is not a waiver of that provision. The word "including" means "including without limitation." You may not assign these Terms without our prior written consent; we may assign them freely. These Terms bind any permitted assignees.',
    ),
    p(
      "10.7 **Copyright/Trademark.** Copyright © 2026 Kaiyu Hsu. All rights reserved. All trademarks, logos, and service marks displayed on the Site are owned by UICapsule or third parties. You may not use any of them without prior written consent from the owner. Open-source code is licensed as described in Section 2.9.",
    ),
    p(`10.8 **Contact Information:** ${EMAIL}`),

    h2("11. Dispute Resolution"),
    p(
      "**Please read this section carefully. It affects your legal rights, including your right to sue in court and your right to a jury trial.**",
    ),
    p(
      "11.1 **Applicability.** Except as described below, you and UICapsule agree to resolve all disputes arising out of or relating to the Site, its services, or these Terms through binding individual arbitration – not in court. Exceptions include: (i) claims that qualify for small claims court, brought on an individual basis; and (ii) requests for equitable relief related to intellectual property (such as trademarks, trade secrets, or copyrights). This arbitration agreement applies to all claims, including those that arose before you agreed to these Terms.",
    ),
    p(
      `11.2 **Try to Resolve First.** Before starting arbitration, the parties agree to try to resolve the dispute informally. The party raising the dispute must send written notice (an "Informal Notice") to the other party. Within 45 days of receiving that Informal Notice, the parties will meet by phone or video in good faith to try to work things out. Our notice address is ${EMAIL}. If the informal dispute resolution process doesn't resolve the dispute within 60 days, either party may start arbitration.`,
    ),
    p(
      "11.3 **Arbitration Rules.** Arbitrations will be administered by JAMS ([www.jamsadr.com](https://www.jamsadr.com)). Claims under $250,000 (excluding fees and interest) will use JAMS' Streamlined Arbitration Rules; larger claims will use JAMS' Comprehensive Arbitration Rules. Unless the parties agree otherwise, arbitration will be conducted in the county where you live. All arbitration materials and documents are confidential.",
    ),
    p(
      "11.4 **Arbitration Request.** The arbitration request must include: (i) your contact information and account username (if applicable); (ii) a description of the claims and supporting facts; (iii) the relief you're seeking and a good-faith damages estimate; (iv) confirmation that you completed the informal resolution process; and (v) proof of any required filing fee payment.",
    ),
    p(
      "11.5 **Authority of Arbitrator.** The arbitrator has authority to resolve all arbitrable disputes, including questions about the scope and enforceability of this arbitration agreement – except that courts (not arbitrators) will decide: (i) challenges to the class action waiver below; (ii) disputes about arbitration fees; (iii) whether a condition precedent to arbitration has been satisfied; and (iv) which version of this agreement applies. The arbitrator may award the same relief as a court, but on an individual basis only. The arbitrator's award is final and binding, and judgment may be entered in any court with jurisdiction.",
    ),
    p(
      "11.6 **Waiver of Jury Trial.** BY AGREEING TO ARBITRATION, YOU AND UICAPSULE WAIVE THE RIGHT TO A TRIAL BY JUDGE OR JURY FOR ALL COVERED CLAIMS.",
    ),
    p(
      "11.7 **Waiver of Class Actions.** ALL DISPUTES MUST BE BROUGHT ON AN INDIVIDUAL BASIS. NEITHER YOU NOR UICAPSULE MAY BRING CLAIMS AS A PLAINTIFF OR CLASS MEMBER IN ANY CLASS, REPRESENTATIVE, OR COLLECTIVE PROCEEDING. The arbitrator may only award relief on an individual basis. If a court finds this class action waiver unenforceable as to a specific claim, that claim may be litigated in state or federal court in San Francisco County, California; all other claims remain subject to arbitration.",
    ),
    p(
      "11.8 **Attorneys' Fees.** Each party bears its own attorneys' fees unless the arbitrator finds a claim was frivolous or brought for an improper purpose.",
    ),
    p(
      "11.9 **Batch Arbitration.** If 100 or more substantially similar arbitration demands are filed against UICapsule within a 30-day period by the same law firm or coordinated group, JAMS will batch them into groups of 100 and appoint one arbitrator per batch, with one set of fees per batch.",
    ),
    p(
      `11.10 **Opt-Out.** You may opt out of this arbitration agreement within 30 days of first accepting these Terms by sending written notice to ${EMAIL}. Your notice must include your name, the email address you use with the Site, and a clear statement that you wish to opt out. Opting out does not affect any other part of these Terms.`,
    ),
    p(
      "11.11 **Severability.** If any part of this arbitration agreement is found invalid, it will be modified to the minimum extent necessary to make it enforceable; the rest of the agreement remains in effect.",
    ),
    divider,
    p(GENERAL_LEGAL_CREDIT),
  ],
  description: `The terms that govern your use of ${siteConfig.name}, including the license for its open-source components and how disputes are resolved.`,
  heading: "Terms of Use",
  path: "/terms",
  sitemapPriority: 0.3,
  title: "Terms of Use",
};

/** Prose pages, in the order they should appear in a sitemap or llms.txt. */
export const prosePages: ProsePage[] = [aboutPage, contactPage, privacyPage, termsPage];

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
