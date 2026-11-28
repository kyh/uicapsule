import { defineTool } from "eve/tools";
import { z } from "zod";

import { githubNetworkPolicy, mintRepositoryToken } from "../lib/github-app";
import { environment } from "../sandbox";

export default defineTool({
  description:
    "Give git and gh in the sandbox fresh access to kyh/uicapsule (contents, issues and pull requests, about one hour). Call it before the first push, gh command or GitHub API call, and again whenever one fails with 401 or 403.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const { expiresAt, token } = await mintRepositoryToken();
    const sandbox = await ctx.getSandbox(environment);

    await sandbox.setNetworkPolicy(githubNetworkPolicy(token));

    return { expiresAt, repository: "kyh/uicapsule" };
  },
});
