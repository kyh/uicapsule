import assert from "node:assert/strict";
import { test } from "node:test";

import { componentRequestSchema } from "./component-request";
import { buildIssueBody, createComponentRequestIssue } from "./github-issue";

const request = componentRequestSchema.parse({
  name: "Shutter button @claude",
  description: "A camera shutter that ripples on press.\nSecond line @claude",
  references: ["https://x.com/someone/status/1"],
  credit: { name: "Ada", url: "https://github.com/ada" },
});

const withToken = (t: { after: (fn: () => void) => void }, token: string | undefined) => {
  const previous = process.env.GITHUB_ISSUES_TOKEN;
  if (token === undefined) delete process.env.GITHUB_ISSUES_TOKEN;
  else process.env.GITHUB_ISSUES_TOKEN = token;
  t.after(() => {
    if (previous === undefined) delete process.env.GITHUB_ISSUES_TOKEN;
    else process.env.GITHUB_ISSUES_TOKEN = previous;
  });
};

test("files a labelled issue with mentions neutralized", async (t) => {
  withToken(t, "test-token");
  let received: Request | undefined;
  const issue = await createComponentRequestIssue(request, async (input, init) => {
    received = new Request(input, init);
    return Response.json({ number: 7, html_url: "https://github.com/kyh/uicapsule/issues/7" });
  });
  assert.deepEqual(issue, { number: 7, html_url: "https://github.com/kyh/uicapsule/issues/7" });
  assert.ok(received);
  assert.equal(received.url, "https://api.github.com/repos/kyh/uicapsule/issues");
  assert.equal(received.method, "POST");
  assert.equal(received.headers.get("authorization"), "Bearer test-token");
  const payload: unknown = await received.json();
  assert.deepEqual(payload, {
    title: "Request: Shutter button ＠claude",
    body: buildIssueBody(request),
    labels: ["request"],
  });
  assert.ok(!buildIssueBody(request).includes("@"));
  assert.match(buildIssueBody(request), /> A camera shutter[\s\S]*> Second line/);
  assert.match(buildIssueBody(request), /\[Ada\]\(https:\/\/github\.com\/ada\)/);
});

test("credit falls back to anonymous and references to none", () => {
  const body = buildIssueBody(
    componentRequestSchema.parse({
      name: "Latch",
      description: "A latch that snaps shut with a visible overshoot.",
      references: [],
      credit: { name: "", url: "" },
    }),
  );
  assert.match(body, /_anonymous_/);
  assert.match(body, /_none_/);
});

const unavailable = { code: "SERVICE_UNAVAILABLE" };

test("reports missing token, provider failure, and network failure as unavailable", async (t) => {
  withToken(t, undefined);
  await assert.rejects(
    createComponentRequestIssue(request, async () => Response.json({})),
    unavailable,
  );

  withToken(t, "test-token");
  await assert.rejects(
    createComponentRequestIssue(request, async () => new Response("nope", { status: 401 })),
    unavailable,
  );
  await assert.rejects(
    createComponentRequestIssue(request, async () => {
      throw new Error("offline");
    }),
    unavailable,
  );
});

test("credit link requires a name", () => {
  const result = componentRequestSchema.safeParse({
    name: "Latch",
    description: "A latch that snaps shut with a visible overshoot.",
    references: [],
    credit: { name: "", url: "https://github.com/ada" },
  });
  assert.ok(!result.success);
});
