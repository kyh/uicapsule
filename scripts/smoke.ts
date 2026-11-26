import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { styleText } from "node:util";
import { createORPCClient, ORPCError } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractClient } from "@repo/contract";
import { z } from "zod";

const BASE_URL = (
  process.env.SMOKE_URL ?? `http://localhost:${process.env.PORT ?? "3000"}`
).replace(/\/$/u, "");

const EMAIL = "smoke@uicapsule.local";

const FOREIGN_ORIGIN = "https://elsewhere.example";

const deadline = () => AbortSignal.timeout(15_000);

const BOOT_BUDGET_MS = 90_000;

class SmokeError extends Error {
  override name = "SmokeError";
}

const fail: (message: string) => never = (message) => {
  throw new SmokeError(message);
};

const url = (route: string) => `${BASE_URL}${route}`;

const BROWSER_HEADERS = { origin: BASE_URL };

let cookie = "";

const link = new RPCLink({
  fetch: async (request, init) => await fetch(request, { ...init, signal: deadline() }),
  headers: () => (cookie ? { ...BROWSER_HEADERS, cookie } : BROWSER_HEADERS),
  origin: BASE_URL,
  url: "/api/orpc",
});

const client: ContractClient = createORPCClient(link);

const describeResponse = async (response: Response) => {
  const body = await response.text().catch(() => "<unreadable body>");
  const trimmed = body.replaceAll(/\s+/gu, " ").trim();

  return `HTTP ${response.status} — ${trimmed.slice(0, 400) || "<empty body>"}`;
};

const get = async (route: string) =>
  await fetch(url(route), { redirect: "manual", signal: deadline() });

const probeHome = async () => {
  try {
    const response = await get("/");

    return response.ok ? null : `HTTP ${response.status}`;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
};

const pollHome: (startedAt: number, attempts: number, lastSeen: string) => Promise<void> = async (
  startedAt,
  attempts,
  lastSeen,
) => {
  if (performance.now() - startedAt >= BOOT_BUDGET_MS) {
    fail(
      `server never answered / at ${BASE_URL} within ${BOOT_BUDGET_MS / 1000}s ` +
        `(${attempts} attempts) — last saw: ${lastSeen}`,
    );
  }

  const seen = await probeHome();

  if (seen === null) {
    return;
  }

  await sleep(250);
  await pollHome(startedAt, attempts + 1, seen);
};

const firstSlug = () => {
  const contentDir = path.join(import.meta.dirname, "..", "content");

  const slug = fs
    .readdirSync(contentDir)
    .toSorted()
    .find((entry) => fs.existsSync(path.join(contentDir, entry, "meta.json")));

  return slug ?? fail(`no content/<slug>/meta.json under ${contentDir}`);
};

const mintSignInCode = () =>
  execFileSync("pnpm", ["--silent", "sign-in-code", EMAIL], { encoding: "utf-8" }).trim();

const signInWithCode = async (origin: string) =>
  await fetch(url("/api/auth/sign-in/email-otp"), {
    body: JSON.stringify({ email: EMAIL, otp: mintSignInCode() }),
    headers: { "content-type": "application/json", origin },
    method: "POST",
    signal: deadline(),
  });

const signIn = async () => {
  const response = await signInWithCode(BASE_URL);

  if (!response.ok) {
    fail(
      `sign-in as ${EMAIL} failed: ${await describeResponse(response)}. ` +
        "Is the database up and pushed? (pnpm db:push)",
    );
  }

  const cookies = response.headers.getSetCookie();

  if (cookies.length === 0) {
    fail("sign-in succeeded but set no session cookie");
  }

  cookie = cookies.map((value) => value.split(";")[0]).join("; ");
};

const refusalOfMe = async () => {
  try {
    await client.user.me();
  } catch (error) {
    return error;
  }

  return fail("user.me answered after sign-out");
};

const registryItem = z.object({ files: z.array(z.unknown()).min(1), name: z.string() });

const step = async <T>(label: string, run: () => Promise<T>) => {
  const startedAt = performance.now();
  let result: T;

  try {
    result = await run();
  } catch (error) {
    if (error instanceof SmokeError) {
      throw error;
    }

    return fail(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const elapsed = styleText("dim", `${Math.round(performance.now() - startedAt)}ms`);
  console.log(`  ${styleText("green", "✓")} ${label} ${elapsed}`);

  return result;
};

const main = async () => {
  console.log(`\n  Smoke test → ${BASE_URL}\n`);

  await step("the gallery answers /", async () => {
    await pollHome(performance.now(), 0, "no response at all");
  });

  const slug = firstSlug();

  await step(`/ui/${slug} renders`, async () => {
    const response = await get(`/ui/${slug}`);

    if (response.status !== 200) {
      fail(`/ui/${slug} answered ${await describeResponse(response)}`);
    }
  });

  await step(`/preview-frame/${slug} is a sandboxed document`, async () => {
    const response = await get(`/preview-frame/${slug}`);
    const policy = response.headers.get("content-security-policy") ?? "";

    if (response.status !== 200 || !policy.startsWith("sandbox")) {
      fail(`/preview-frame/${slug} answered ${response.status} under "${policy || "no policy"}"`);
    }
  });

  await step(`/r/${slug}.json is a registry item`, async () => {
    const response = await get(`/r/${slug}.json`);

    if (response.status !== 200) {
      fail(`/r/${slug}.json answered ${await describeResponse(response)}`);
    }

    registryItem.parse(await response.json());
  });

  await step("a code's sign-in from another site is refused", async () => {
    const response = await signInWithCode(FOREIGN_ORIGIN);

    if (response.status !== 403) {
      fail(`a sign-in from ${FOREIGN_ORIGIN} answered ${await describeResponse(response)}`);
    }
  });

  await step(`signed in as ${EMAIL} by an emailed code`, signIn);

  await step("user.me answers the signed-in user", async () => {
    const me = await client.user.me();

    if (me.email !== EMAIL) {
      fail(`user.me answered ${me.email}, not ${EMAIL}`);
    }
  });

  await step("signed out, user.me refuses", async () => {
    const response = await fetch(url("/api/auth/sign-out"), {
      body: "{}",
      headers: { ...BROWSER_HEADERS, "content-type": "application/json", cookie },
      method: "POST",
      signal: deadline(),
    });

    if (!response.ok) {
      fail(`sign-out failed: ${await describeResponse(response)}`);
    }

    const refusal = await refusalOfMe();

    if (!(refusal instanceof ORPCError) || refusal.code !== "UNAUTHORIZED") {
      fail(`user.me after sign-out threw ${String(refusal)}, not UNAUTHORIZED`);
    }
  });

  console.log(`\n  ${styleText("green", "Smoke test passed.")}\n`);
};

const run = async () => {
  try {
    await main();
  } catch (error) {
    console.error(
      `\n  ${styleText("red", "✗ Smoke test failed:")} ${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exit(1);
  }
};

void run();
