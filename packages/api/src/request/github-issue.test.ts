import assert from "node:assert/strict";
import { test } from "node:test";

import { componentRequestSchema } from "./component-request";
import { buildIssueBody, createComponentRequestIssue } from "./github-issue";

const request = componentRequestSchema.parse({
  attachments: [
    "https://github.com/user-attachments/assets/aaa-111",
    "https://github.com/user-attachments/assets/bbb-222",
  ],
  credit: { name: "Ada", url: "https://github.com/ada" },
  description: "A camera shutter that ripples on press.\nSecond line @claude",
  name: "Shutter button @claude",
  references: ["https://x.com/someone/status/1"],
});

const withToken = (t: { after: (fn: () => void) => void }, token?: string) => {
  const previous = process.env.GITHUB_ISSUES_TOKEN;
  if (token === undefined) {
    delete process.env.GITHUB_ISSUES_TOKEN;
  } else {
    process.env.GITHUB_ISSUES_TOKEN = token;
  }
  t.after(() => {
    if (previous === undefined) {
      delete process.env.GITHUB_ISSUES_TOKEN;
    } else {
      process.env.GITHUB_ISSUES_TOKEN = previous;
    }
  });
};

test("files a labelled issue with mentions neutralized", async (t) => {
  withToken(t, "test-token");
  let received: Request | undefined;
  const issue = await createComponentRequestIssue(request, (input, init) => {
    received = new Request(input, init);
    return Promise.resolve(
      Response.json({ html_url: "https://github.com/kyh/uicapsule/issues/7", number: 7 }),
    );
  });
  assert.deepEqual(issue, { html_url: "https://github.com/kyh/uicapsule/issues/7", number: 7 });
  assert.ok(received);
  assert.equal(received.url, "https://api.github.com/repos/kyh/uicapsule/issues");
  assert.equal(received.method, "POST");
  assert.equal(received.headers.get("authorization"), "Bearer test-token");
  const payload: unknown = await received.json();
  assert.deepEqual(payload, {
    body: buildIssueBody(request),
    labels: ["request"],
    title: "Request: Shutter button ＠claude",
  });
  assert.ok(!buildIssueBody(request).includes("@"));
  assert.match(buildIssueBody(request), /> A camera shutter[\s\S]*> Second line/u);
  assert.match(buildIssueBody(request), /\[Ada\]\(https:\/\/github\.com\/ada\)/u);
  assert.match(
    buildIssueBody(request),
    /### Attachments\n\nhttps:\/\/github\.com\/user-attachments\/assets\/aaa-111\n\nhttps:\/\/github\.com\/user-attachments\/assets\/bbb-222\n/u,
  );
});

test("credit falls back to anonymous and references to none", () => {
  const body = buildIssueBody(
    componentRequestSchema.parse({
      attachments: [],
      credit: { name: "", url: "" },
      description: "A latch that snaps shut with a visible overshoot.",
      name: "Latch",
      references: [],
    }),
  );
  assert.match(body, /_anonymous_/u);
  assert.equal(body.match(/_none_/gu)?.length, 2);
});

const unavailable = { code: "SERVICE_UNAVAILABLE" };

test("reports missing token, provider failure, and network failure as unavailable", async (t) => {
  withToken(t);
  await assert.rejects(
    createComponentRequestIssue(request, () => Promise.resolve(Response.json({}))),
    unavailable,
  );

  withToken(t, "test-token");
  await assert.rejects(
    createComponentRequestIssue(request, () =>
      Promise.resolve(new Response("nope", { status: 401 })),
    ),
    unavailable,
  );
  await assert.rejects(
    createComponentRequestIssue(request, () => Promise.reject(new Error("offline"))),
    unavailable,
  );
});

test("credit link requires a name", () => {
  const result = componentRequestSchema.safeParse({
    attachments: [],
    credit: { name: "", url: "https://github.com/ada" },
    description: "A latch that snaps shut with a visible overshoot.",
    name: "Latch",
    references: [],
  });
  assert.ok(!result.success);
});
