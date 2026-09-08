import { publicProcedure } from "../orpc";
import { componentRequestSchema } from "./component-request";
import { createComponentRequestIssue, REQUESTS_REPO } from "./github-issue";

export const requestRouter = {
  create: publicProcedure.input(componentRequestSchema).handler(async ({ input }) => {
    // Bots that fill the honeypot get a plausible answer and no issue.
    if (input.website) return { url: `https://github.com/${REQUESTS_REPO}/issues` };
    const issue = await createComponentRequestIssue(input);
    return { url: issue.html_url, number: issue.number };
  }),
};
