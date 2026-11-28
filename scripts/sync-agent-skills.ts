import { cpSync, readdirSync, rmSync } from "node:fs";
import path from "node:path";

const SOURCE = path.join(import.meta.dirname, "../.claude/skills");
const TARGET = path.join(import.meta.dirname, "../apps/web/agent/skills");

rmSync(TARGET, { force: true, recursive: true });

const skills = readdirSync(SOURCE, { withFileTypes: true }).filter((entry) => entry.isDirectory());

for (const skill of skills) {
  cpSync(path.join(SOURCE, skill.name), path.join(TARGET, skill.name), { recursive: true });
}

console.log(`[sync-agent-skills] copied ${skills.length} skills into apps/web/agent/skills`);
