import { type } from "@orpc/contract";

import { protectedBase } from "../base";
import { createUploadSchema, prepareSchema, publishSchema } from "./ugc-schema";

/** One file of a build and the signed URL it is PUT to. */
interface UploadSlot {
  contentType: string;
  path: string;
  url: string;
}

interface PublishedComponent {
  build: string;
  handle: string;
  name: string;
  path: string;
  slug: string;
  updatedAt: Date;
}

export const ugcContract = {
  /** Signed upload URLs for a build's files. Files already uploaded for this build are skipped. */
  createUpload: protectedBase.input(createUploadSchema).output(type<{ uploads: UploadSlot[] }>()),
  /**
   * Checks the account may publish this slug, and starts a build: its id, and the public URL its
   * files will live under, which the bundler needs as its asset base before it builds.
   */
  prepare: protectedBase.input(prepareSchema).output(type<{ assetBase: string; build: string }>()),
  /** The signed-in user's published components, newest first. */
  list: protectedBase.output(type<PublishedComponent[]>()),
  /** Points the slug at an uploaded build, creating the component on first publish. */
  publish: protectedBase.input(publishSchema).output(type<PublishedComponent>()),
};
