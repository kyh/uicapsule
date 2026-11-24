import { siteConfig } from "@/lib/site-config";

export const SKILLS_EXTENSION = "io.modelcontextprotocol/skills";

export const SKILL_CACHE_HINT = { cacheScope: "public", ttlMs: 60 * 60 * 1000 } as const;

export interface SkillFile {
  path: string;
  text: string;
}

export interface Skill {
  description: string;
  files: SkillFile[];
  name: string;
}

const NAME = "uicapsule-components";

const DESCRIPTION = `Find, install and adapt ${siteConfig.name}'s interactive React components (hardware gestures, OS motion, physical mechanisms) in a React and Tailwind CSS project. Use when someone wants an interaction with unusual motion, names a ${siteConfig.name} component, or asks to install one.`;

const body = `# ${siteConfig.name} components

${siteConfig.name} is a curated gallery of interactive React components that translate interactions the web rarely has: hardware (a fingerprint ripple, a shutter), OS motion (a dynamic island, predictive back), physical mechanisms (dials, latches, pull cords). It is not a general UI kit: reach for it when the interaction is the point, not for a plain button or form.

## Find one

1. Call \`search_components\` with words for what it does or looks like ("rotary dial", "ios volume slider"). Filter by \`tags\` when a kind or style is asked for. An empty query lists the newest first.
2. Read each result's \`description\`, and open its \`url\` to watch it run before choosing: every entry sells itself in motion.
3. Call \`get_component\` with the chosen \`slug\` for its install command, its npm dependencies and the full source of every file.

## Install it

- When \`installable\` is true, run its \`install\` command (\`npx shadcn@latest add ${siteConfig.url}/r/<slug>.json\`) from the project root. It writes the files under \`uicapsule/<slug>/\` and installs the npm dependencies. The shadcn CLI expects a \`components.json\`: if the project has none, let \`shadcn init\` create one, or write the files from \`get_component\` by hand at the same paths and install its \`dependencies\` yourself.
- When \`installable\` is false, the entry is a live demo hosted elsewhere: point the person at its \`sourceUrl\` rather than copying code.
- Each component needs React 19 and Tailwind CSS v4, and styles itself with Tailwind classes. If it renders unstyled, the stylesheet is not scanning the new folder: add \`@source "<path to>/uicapsule";\` to the CSS file that imports Tailwind.
- Most components are client components (\`"use client"\`). In Next.js App Router, render them from a page or a client boundary as they are; don't strip the directive.

## Use it

- \`preview.tsx\` shows how the component is meant to be mounted: its size, backdrop and props. Start from it, then delete it once the component sits where it belongs.
- Change what the component exposes (props, content, colours) rather than its motion. The timing, springs and gestures are what was curated; rewriting them in another animation library loses them.
- Keep any reduced-motion handling the component ships, and check its touch and keyboard behaviour on the page it lands in.

## Before you finish

- Run the project's dev server and look at the component on its page, beside its \`url\` on ${siteConfig.name}: the motion should match.
- Typecheck: the component's own files are strict TypeScript and should pass as installed.
`;

export const SKILLS: Skill[] = [
  {
    description: DESCRIPTION,
    files: [
      {
        path: "SKILL.md",
        text: `---\nname: ${NAME}\ndescription: ${JSON.stringify(DESCRIPTION)}\n---\n\n${body}`,
      },
    ],
    name: NAME,
  },
];

export const skillUri = (skill: Skill, path = "SKILL.md") => `skill://${skill.name}/${path}`;

const fileEntry = async (uri: string, text: string) => {
  const bytes = new TextEncoder().encode(text);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const hex = [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");

  return { digest: `sha256:${hex}`, size: bytes.byteLength, uri };
};

const entryOf = async (skill: Skill) => ({
  frontmatter: { description: skill.description, name: skill.name },
  resources: await Promise.all(
    skill.files.map(async (file) => await fileEntry(skillUri(skill, file.path), file.text)),
  ),
  uri: skillUri(skill),
});

let catalog: Promise<Awaited<ReturnType<typeof entryOf>>[]> | undefined;

/** The skills as `skills/list` lists them: each SKILL.md's address, its frontmatter and every file's digest and size. */
export const skillCatalog = async () => {
  catalog ??= Promise.all(SKILLS.map(entryOf));

  return await catalog;
};
