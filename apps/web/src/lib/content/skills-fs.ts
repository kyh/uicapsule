import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const skillsRoot = path.resolve(process.cwd(), "..", "..", ".claude", "skills");

const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

const frontmatterField = (text: string, field: string) => {
  const block = /^---\n(?<body>[\s\S]*?)\n---\n/u.exec(text)?.groups?.body ?? "";
  const line = block.split("\n").find((entry) => entry.startsWith(`${field}: `));

  return line?.slice(field.length + 2).trim() || null;
};

const readMarkdownFiles = async (root: string) => {
  const files: { path: string; text: string }[] = [];

  const walk = async (dir: string) => {
    const entries = await readdir(dir, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await walk(full);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          const text = await readFile(full, "utf-8");
          files.push({ path: path.relative(root, full).replaceAll("\\", "/"), text });
        }
      }),
    );
  };

  await walk(root);

  return files.toSorted(
    (a, b) =>
      Number(b.path === "SKILL.md") - Number(a.path === "SKILL.md") || a.path.localeCompare(b.path),
  );
};

/** Reads `.claude/skills/<name>/`: its Markdown files, SKILL.md first, and the name and description its frontmatter declares. */
export const readRepoSkill = async (name: string) => {
  if (!SKILL_NAME.test(name)) {
    throw new Error(`Invalid skill name: ${name}`);
  }

  const files = await readMarkdownFiles(path.join(skillsRoot, name));
  const [main] = files;
  const description = main?.path === "SKILL.md" ? frontmatterField(main.text, "description") : null;

  if (!main || frontmatterField(main.text, "name") !== name || !description) {
    throw new Error(`.claude/skills/${name}/SKILL.md needs name: ${name} and a description`);
  }

  return { description, files, name };
};
