import { postUserAttachment } from "@repo/service/request/github-upload";
import { defineTool } from "eve/tools";
import path from "node:path";
import { z } from "zod";

import { environment } from "../sandbox";

const MAX_VIDEO_BYTES = 10 * 1024 * 1024;

export default defineTool({
  description:
    "Upload an .mp4 from the sandbox to GitHub's attachment store for kyh/uicapsule and get its URL. Put the URL on a line of its own in a pull request body and GitHub shows it as a video player. At most 10 MB, h264.",
  inputSchema: z.object({
    path: z
      .string()
      .regex(/\.mp4$/u)
      .describe("Sandbox path of the .mp4, absolute or relative to the workspace"),
  }),
  async execute(input, ctx) {
    const token = process.env.GITHUB_ISSUES_TOKEN;

    if (token === undefined || token === "") {
      throw new Error("GITHUB_ISSUES_TOKEN is not set on the deployment, so videos can't upload.");
    }

    const sandbox = await ctx.getSandbox(environment);
    const bytes = await sandbox.readBinaryFile({ path: input.path });

    if (bytes === null) {
      throw new Error(`${input.path} does not exist in the sandbox.`);
    }

    if (bytes.byteLength > MAX_VIDEO_BYTES) {
      throw new Error(
        `${input.path} is ${bytes.byteLength} bytes; GitHub takes at most ${MAX_VIDEO_BYTES}. Re-encode it smaller.`,
      );
    }

    const result = await postUserAttachment({
      body: new Blob([new Uint8Array(bytes)], { type: "video/mp4" }),
      name: path.posix.basename(input.path),
      token,
      type: "video/mp4",
    });

    if (result.kind !== "uploaded") {
      throw new Error(`GitHub refused the upload (${result.kind}): ${String(result.cause)}`);
    }

    return { bytes: bytes.byteLength, url: result.url };
  },
});
