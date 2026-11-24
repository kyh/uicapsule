import { z } from "zod";

export const pickModeSchema = z.enum(["area", "element"]);

export type PickMode = z.infer<typeof pickModeSchema>;

const rectSchema = z.object({
  height: z.number(),
  width: z.number(),
  x: z.number(),
  y: z.number(),
});

export type Rect = z.infer<typeof rectSchema>;

export const selectionSchema = z.object({
  element: z
    .object({
      html: z.string(),
      label: z.string(),
      selector: z.string(),
    })
    .optional(),
  page: z.object({ title: z.string(), url: z.string() }),
  rect: rectSchema,
  video: z
    .object({
      kind: z.enum(["file", "stream"]),
      src: z.string(),
    })
    .optional(),
  viewport: z.object({ height: z.number(), width: z.number() }),
});

export type Selection = z.infer<typeof selectionSchema>;

export const pickerEventSchema = z.discriminatedUnion("type", [
  z.object({ selection: selectionSchema, type: z.literal("picker:done") }),
  z.object({ type: z.literal("picker:cancel") }),
]);

export const pickerCommandSchema = z.discriminatedUnion("type", [
  z.object({ mode: pickModeSchema, type: z.literal("picker:start") }),
  z.object({ type: z.literal("picker:stop") }),
  z.object({ type: z.literal("picker:record") }),
]);

export type PickerCommand = z.infer<typeof pickerCommandSchema>;

export const recordingSchema = z.discriminatedUnion("ok", [
  z.object({ dataUrl: z.string(), ok: z.literal(true), type: z.string() }),
  z.object({ ok: z.literal(false), reason: z.string() }),
]);

export type Recording = z.infer<typeof recordingSchema>;
