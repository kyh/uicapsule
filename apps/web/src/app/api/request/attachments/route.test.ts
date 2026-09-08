import assert from "node:assert/strict";
import { test } from "node:test";
import { NextRequest } from "next/server";

import { POST } from "./route";

const APP_ORIGIN = "http://localhost:3000";

const post = (body: FormData | null, headers: Record<string, string> = {}) =>
  POST(
    new NextRequest(`${APP_ORIGIN}/api/request/attachments`, {
      body,
      headers,
      method: "POST",
    }),
  );

test("refuses cross-origin uploads", async () => {
  const response = await post(new FormData(), { origin: "http://localhost:3398" });
  assert.equal(response.status, 403);
});

test("rejects a missing file and an unsupported type before touching GitHub", async () => {
  const missing = await post(new FormData(), { origin: APP_ORIGIN });
  assert.equal(missing.status, 400);
  const form = new FormData();
  form.set("file", new File(["x"], "a.exe", { type: "application/x-msdownload" }));
  const unsupported = await post(form, { origin: APP_ORIGIN });
  assert.equal(unsupported.status, 400);
});

test("reports unavailability without a token", async (t) => {
  const previous = process.env.GITHUB_ISSUES_TOKEN;
  delete process.env.GITHUB_ISSUES_TOKEN;
  t.after(() => {
    if (previous !== undefined) {
      process.env.GITHUB_ISSUES_TOKEN = previous;
    }
  });
  const form = new FormData();
  form.set("file", new File(["x"], "a.png", { type: "image/png" }));
  const response = await post(form, { origin: APP_ORIGIN });
  assert.equal(response.status, 503);
});
