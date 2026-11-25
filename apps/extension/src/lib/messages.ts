import { captureSchema } from "@repo/contract/request/request-schema";
import { z } from "zod";

export const toolSchema = z.enum(["region", "visible"]);

export type Tool = z.infer<typeof toolSchema>;

const rectSchema = z.object({
  height: z.number(),
  width: z.number(),
  x: z.number(),
  y: z.number(),
});

export type Rect = z.infer<typeof rectSchema>;

const viewportSchema = z.object({ height: z.number(), width: z.number() });

export const encodedSchema = z.object({
  base64: z.string(),
  name: z.string(),
  type: z.string(),
});

export type Encoded = z.infer<typeof encodedSchema>;

const draftSchema = z.object({
  capture: captureSchema,
  credit: z.object({ name: z.string(), url: z.string() }),
  description: z.string(),
  name: z.string(),
  references: z.array(z.string()),
});

export type Draft = z.infer<typeof draftSchema>;

/** What the popup and the in-page overlay ask of the background worker. */
export const workerRequestSchema = z.discriminatedUnion("type", [
  z.object({ rect: rectSchema, type: z.literal("capture"), viewport: viewportSchema }),
  z.object({ src: z.string(), type: z.literal("video") }),
  z.object({ draft: draftSchema, files: z.array(encodedSchema), type: z.literal("submit") }),
  z.object({ type: z.literal("options") }),
  z.object({ tabId: z.number(), tool: toolSchema, type: z.literal("run") }),
]);

export type WorkerRequest = z.infer<typeof workerRequestSchema>;

export const fileResultSchema = z.discriminatedUnion("ok", [
  z.object({ file: encodedSchema, ok: z.literal(true) }),
  z.object({ ok: z.literal(false), reason: z.string() }),
]);

export type FileResult = z.infer<typeof fileResultSchema>;

export const submitResultSchema = z.discriminatedUnion("ok", [
  z.object({ number: z.number().optional(), ok: z.literal(true), url: z.string() }),
  z.object({ ok: z.literal(false), reason: z.string() }),
]);

export type SubmitResult = z.infer<typeof submitResultSchema>;

export const runResultSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true) }),
  z.object({ ok: z.literal(false), reason: z.string() }),
]);

export type RunResult = z.infer<typeof runResultSchema>;

/** What the background asks of the overlay it injected: pick with a tool, or take what was right-clicked. */
export const overlayStartSchema = z.object({
  src: z.string().optional(),
  tool: z.enum(["media", "region", "visible"]),
  type: z.literal("overlay:start"),
});

export type OverlayStart = z.infer<typeof overlayStartSchema>;
