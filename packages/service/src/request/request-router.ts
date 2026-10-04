import { ATTACHMENT_URL_PREFIX } from "@repo/contract/request/attachment-schema";
import { ORPCError } from "@orpc/server";

import { os } from "../orpc";
import { createComponentRequestIssue, REQUESTS_REPO } from "./github-issue";

export const requestRouter = {
  create: os.request.create.handler(async ({ input }) => {
    // Bots that fill the honeypot get a plausible answer and no issue.
    if (input.website) {
      return { url: `https://github.com/${REQUESTS_REPO}/issues` };
    }
    if (input.attachments.some((url) => !url.startsWith(ATTACHMENT_URL_PREFIX))) {
      throw new ORPCError("BAD_REQUEST", { message: "Attachments must be uploaded here first." });
    }
    const issue = await createComponentRequestIssue(input);
    return { number: issue.number, url: issue.html_url };
  }),
};
