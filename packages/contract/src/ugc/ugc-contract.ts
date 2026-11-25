import { type } from "@orpc/contract";

import { protectedBase } from "../base";
import { createUploadSchema, prepareSchema, publishSchema } from "./ugc-schema";

/** One file of a build and the single-use Blob client token that may write it. */
interface UploadSlot {
  contentType: string;
  path: string;
  pathname: string;
  token: string;
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
  /** Upload tokens for a build's files. Files already uploaded for this build are skipped. */
  createUpload: protectedBase.input(createUploadSchema).output(type<{ uploads: UploadSlot[] }>()),
  /**
   * Checks the account may publish this slug and returns the public URL its assets will live
   * under, which the bundler needs before it builds.
   */
  prepare: protectedBase.input(prepareSchema).output(type<{ assetBase: string }>()),
  /** The signed-in user's published components, newest first. */
  list: protectedBase.output(type<PublishedComponent[]>()),
  /** Points the slug at an uploaded build, creating the component on first publish. */
  publish: protectedBase.input(publishSchema).output(type<PublishedComponent>()),
};
