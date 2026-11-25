import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseEnv } from "node:util";

/** The Blob read-write token from the environment, else from the repo's `.env.local`. */
export const blobToken = async (repoRoot: string) => {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return process.env.BLOB_READ_WRITE_TOKEN;
  }

  const local = await readFile(path.join(repoRoot, ".env.local"), "utf-8").catch(() => "");
  const token = parseEnv(local).BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is unset and missing from .env.local");
  }

  return token;
};
