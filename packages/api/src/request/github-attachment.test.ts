import assert from "node:assert/strict";
import { test } from "node:test";

import { attachmentMetaSchema, uploadAttachment } from "./github-attachment";

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

const meta = attachmentMetaSchema.parse({ name: "clip.mov", size: 3, type: "video/quicktime" });
const blob = new Blob(["abc"]);

test("posts raw bytes to GitHub's user-attachments store for this repository", async (t) => {
  withToken(t, "test-token");
  let received: Request | undefined;
  const url = await uploadAttachment(meta, blob, (input, init) => {
    received = new Request(input, init);
    return Promise.resolve(
      Response.json({ url: "https://github.com/user-attachments/assets/abc-123" }),
    );
  });
  assert.equal(url, "https://github.com/user-attachments/assets/abc-123");
  assert.ok(received);
  const target = new URL(received.url);
  assert.equal(
    target.origin + target.pathname,
    "https://uploads.github.com/user-attachments/assets",
  );
  assert.equal(target.searchParams.get("name"), "clip.mov");
  assert.equal(target.searchParams.get("content_type"), "video/quicktime");
  assert.equal(target.searchParams.get("repository_id"), "329844766");
  assert.equal(received.headers.get("authorization"), "Bearer test-token");
  assert.equal(received.headers.get("content-type"), "application/octet-stream");
  assert.equal(await received.text(), "abc");
});

test("refuses an asset URL outside GitHub's attachment host", async (t) => {
  withToken(t, "test-token");
  await assert.rejects(
    uploadAttachment(meta, blob, () =>
      Promise.resolve(Response.json({ url: "https://evil.example/x" })),
    ),
    { status: 500 },
  );
});

test("is unavailable without a token and on provider or network failure", async (t) => {
  withToken(t);
  await assert.rejects(
    uploadAttachment(meta, blob, () => Promise.resolve(Response.json({}))),
    { status: 503 },
  );
  withToken(t, "test-token");
  await assert.rejects(
    uploadAttachment(meta, blob, () => Promise.resolve(new Response("no", { status: 401 }))),
    { status: 503 },
  );
  await assert.rejects(
    uploadAttachment(meta, blob, () => Promise.reject(new Error("offline"))),
    { status: 503 },
  );
});

test("caps size and type at the boundary", () => {
  assert.ok(
    !attachmentMetaSchema.safeParse({ name: "a.mp4", size: 5e6, type: "video/mp4" }).success,
  );
  assert.ok(
    !attachmentMetaSchema.safeParse({ name: "a.exe", size: 1, type: "application/x-msdownload" })
      .success,
  );
});
