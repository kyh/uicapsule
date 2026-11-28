import { captureSchema } from "@repo/contract/request/request-schema";
import { z } from "zod";

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

/**
 * What the background asks of the overlay it injected: open the inspect bar to pick a region, the
 * visible area or what was right-clicked (`start`), or open or close it from the toolbar icon
 * (`toggle`).
 */
export const overlayMessageSchema = z.discriminatedUnion("type", [
  z.object({
    src: z.string().optional(),
    tool: z.enum(["media", "region", "visible"]),
    type: z.literal("overlay:start"),
  }),
  z.object({ type: z.literal("overlay:toggle") }),
]);

export type OverlayMessage = z.infer<typeof overlayMessageSchema>;

export type OverlayStart = Extract<OverlayMessage, { type: "overlay:start" }>;
