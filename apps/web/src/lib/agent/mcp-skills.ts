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

/** The skills `/mcp` serves, read from the repo's `.claude/skills/<name>/`, the one copy dev agents load too. Provenance lives in `.claude/skills/THIRD_PARTY.md`. */
export const REPO_SKILLS = [
  "animate",
  "animation-performance",
  "animation-vocabulary",
  "apple-design",
  "ask-sonner",
  "better-accessibility",
  "better-colors",
  "better-interface",
  "better-layout",
  "better-motion",
  "better-typography",
  "better-ui",
  "better-writing",
  "break",
  "break-ui",
  "build-design",
  "choreograph",
  "emil-design-eng",
  "explain-interface",
  "find-animation-opportunities",
  "gestures",
  "improve-animations",
  "interface-review",
  "mobile-native",
  "pick-ui-library",
  "prototype",
  "remove-animations",
  "review-animations",
  "state-machine",
  "variant",
] as const;

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

/** The skills as `skills/list` lists them: each SKILL.md's address, its frontmatter and every file's digest and size. */
export const skillCatalog = async (skills: Skill[]) => await Promise.all(skills.map(entryOf));
