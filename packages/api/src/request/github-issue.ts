import { ORPCError } from "@orpc/server";
import { z } from "zod";

import type { ComponentRequest } from "./component-request";

export const REQUESTS_REPO = "kyh/uicapsule";
export const REQUEST_LABEL = "request";

const createdIssueSchema = z.object({ html_url: z.url(), number: z.number().int() });

export type CreatedIssue = z.infer<typeof createdIssueSchema>;

// `@` mentions in visitor text would page people and, worse, trigger the
// `@claude` workflow on this repo. Fullwidth `＠` reads the same and mentions nobody.
const neutralizeMentions = (text: string) => text.replaceAll("@", "＠");

const quote = (text: string) =>
  neutralizeMentions(text)
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");

const formatCredit = ({ name, url }: ComponentRequest["credit"]) => {
  if (!name) {
    return "_anonymous_";
  }
  if (!url) {
    return neutralizeMentions(name);
  }
  return `[${neutralizeMentions(name)}](${neutralizeMentions(url)})`;
};

export const buildIssueBody = (request: ComponentRequest) => {
  const references =
    request.references.length > 0
      ? request.references.map((url) => `- ${neutralizeMentions(url)}`).join("\n")
      : "_none_";
  const attachments =
    request.attachments.length > 0
      ? request.attachments
          // GitHub renders an attachment image inline and a bare asset URL as a video player;
          // the extension is not in the URL, so every asset gets the bare form.
          .map((url) => neutralizeMentions(url))
          .join("\n\n")
      : "_none_";
  const credit = formatCredit(request.credit);

  return [
    "### What it does",
    "",
    quote(request.description),
    "",
    "### References",
    "",
    references,
    "",
    "### Attachments",
    "",
    attachments,
    "",
    "### Credit",
    "",
    credit,
    "",
    "---",
    "_Filed from the request form on uicapsule.com._",
  ].join("\n");
};

export const createComponentRequestIssue = async (
  request: ComponentRequest,
  send: typeof fetch = fetch,
): Promise<CreatedIssue> => {
  const token = process.env.GITHUB_ISSUES_TOKEN;
  if (!token) {
    throw new ORPCError("SERVICE_UNAVAILABLE", {
      message: "Requests are temporarily unavailable. Try again later.",
    });
  }

  let response: Response;
  try {
    response = await send(`https://api.github.com/repos/${REQUESTS_REPO}/issues`, {
      body: JSON.stringify({
        body: buildIssueBody(request),
        labels: [REQUEST_LABEL],
        title: `Request: ${neutralizeMentions(request.name)}`,
      }),
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      method: "POST",
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error("GitHub issue creation failed", error);
    throw new ORPCError("SERVICE_UNAVAILABLE", {
      message: "Unable to file the request. Try again later.",
    });
  }

  if (!response.ok) {
    console.error("GitHub issue creation failed", response.status, await response.text());
    throw new ORPCError("SERVICE_UNAVAILABLE", {
      message: "Unable to file the request. Try again later.",
    });
  }

  const parsed = createdIssueSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "GitHub returned an unexpected response.",
    });
  }
  return parsed.data;
};
