#!/usr/bin/env tsx
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { defineCommand, runMain } from "citty";
import { consola } from "consola";

const repoRoot = path.resolve(import.meta.dirname, "..");
const envPath = path.join(repoRoot, ".env");
const DB_FILE = "packages/db/local.db";
const DB_LOG = "packages/db/turso-dev.log";
const DB_BOOT_BUDGET_MS = 15_000;

const commandExists = (command: string) => {
  try {
    execSync(`command -v ${command}`, { stdio: "ignore" });

    return true;
  } catch {
    return false;
  }
};

const readEnvValue = (name: string) => {
  const line = fs
    .readFileSync(envPath, "utf-8")
    .split("\n")
    .find((row) => row.startsWith(`${name}=`));

  return line?.slice(name.length + 1).replaceAll(/^"|"$/gu, "") ?? "";
};

const databaseUrl = () => {
  if (process.env.TURSO_DATABASE_URL !== undefined && process.env.TURSO_DATABASE_URL !== "") {
    return process.env.TURSO_DATABASE_URL;
  }

  return fs.existsSync(envPath) ? readEnvValue("TURSO_DATABASE_URL") : "http://127.0.0.1:8080";
};

const databaseAnswers = async (url: string) => {
  try {
    await fetch(url, { signal: AbortSignal.timeout(1000) });

    return true;
  } catch {
    return false;
  }
};

const checkAgentTooling = () => {
  if (commandExists("agent-browser")) {
    consola.success("agent-browser found");

    return;
  }

  consola.info(
    "agent-browser not found (optional): npm i -g agent-browser && agent-browser install",
  );
};

const main = defineCommand({
  args: {
    "dry-run": {
      default: false,
      description: "Print the steps without running them.",
      type: "boolean",
    },
    yes: {
      default: false,
      description: "Never prompt (also the default without a TTY).",
      type: "boolean",
    },
  },
  meta: {
    description:
      "Set up local development: .env, a local Turso server, and the schema. Idempotent.",
    name: "bootstrap",
  },
  run: async ({ args }) => {
    const dryRun = args["dry-run"];
    const interactive = process.stdin.isTTY && !args.yes;

    const exec = (command: string) => {
      if (dryRun) {
        consola.info(`[dry-run] ${command}`);

        return;
      }

      execSync(command, {
        cwd: repoRoot,
        stdio: [interactive ? "inherit" : "ignore", "inherit", "inherit"],
      });
    };

    const createEnv = () => {
      if (fs.existsSync(envPath)) {
        consola.success(".env already exists, keeping it");

        return;
      }

      if (dryRun) {
        consola.info("[dry-run] cp .env.example .env");

        return;
      }

      fs.copyFileSync(path.join(repoRoot, ".env.example"), envPath);
      consola.success(".env created from .env.example");
    };

    const ensureDatabase = async () => {
      const url = databaseUrl();

      if (!url.startsWith("http://127.0.0.1") && !url.startsWith("http://localhost")) {
        throw new Error(
          `TURSO_DATABASE_URL is ${url}, not a local server. Bootstrap only sets up a local ` +
            "database; point .env at http://127.0.0.1:8080, or run pnpm db:push yourself if you mean it.",
        );
      }

      if (await databaseAnswers(url)) {
        consola.success(`local Turso already answers at ${url}`);

        return;
      }

      if (dryRun) {
        consola.info(`[dry-run] turso dev --db-file ${DB_FILE} (detached, log ${DB_LOG})`);

        return;
      }

      if (!commandExists("turso")) {
        throw new Error(
          "the turso CLI is not on PATH. Install it (brew install tursodatabase/tap/turso, or " +
            "curl -sSfL https://get.tur.so/install.sh | bash), then re-run pnpm bootstrap.",
        );
      }

      const log = fs.openSync(path.join(repoRoot, DB_LOG), "a");

      const child = spawn("turso", ["dev", "--db-file", DB_FILE], {
        cwd: repoRoot,
        detached: true,
        stdio: ["ignore", log, log],
      });

      child.unref();

      const startedAt = performance.now();

      const answers: () => Promise<boolean> = async () => {
        if (performance.now() - startedAt >= DB_BOOT_BUDGET_MS) {
          return false;
        }

        if (await databaseAnswers(url)) {
          return true;
        }

        await sleep(250);

        return await answers();
      };

      if (await answers()) {
        consola.success(
          `started local Turso at ${url} (pid ${child.pid}, log ${DB_LOG}; stop it with kill ${child.pid})`,
        );

        return;
      }

      throw new Error(
        `turso dev did not answer at ${url} within ${DB_BOOT_BUDGET_MS / 1000}s; see ${DB_LOG}`,
      );
    };

    try {
      createEnv();
      await ensureDatabase();
      exec("pnpm db:push");
      consola.success("schema pushed");
      checkAgentTooling();
      consola.ready("pnpm dev:web → http://localhost:3000");
    } catch (error) {
      consola.error(`Bootstrap failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  },
});

void runMain(main);
