import { os, requireSession } from "../orpc";
import { createUploads, listPublished, publishBuild, startBuild } from "./ugc-publish";

const authed = os.ugc.use(requireSession);

export const ugcRouter = {
  createUpload: authed.createUpload.handler(
    async ({ context, input }) => await createUploads(context.session.user, input),
  ),

  list: authed.list.handler(async ({ context }) => await listPublished(context.session.user)),

  prepare: authed.prepare.handler(
    async ({ context, input }) => await startBuild(context.session.user, input.slug),
  ),

  publish: authed.publish.handler(
    async ({ context, input }) => await publishBuild(context.session.user, input),
  ),
};
