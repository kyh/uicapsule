import { z } from "zod";

export const getContentComponentInput = z.object({
  slug: z.string(),
});
export type GetContentComponentInput = z.infer<typeof getContentComponentInput>;

export const getContentComponentsInput = z
  .object({
    filterTags: z.array(z.string()).optional(),
  })
  .optional();
export type GetContentComponentsInput = z.infer<
  typeof getContentComponentsInput
>;

export const searchContentInput = z.object({
  query: z.string().optional(),
  limit: z.number().optional().default(12),
});
export type SearchContentInput = z.infer<typeof searchContentInput>;
