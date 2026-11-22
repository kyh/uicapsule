import { z } from "zod";

import { ATTACHMENT_MAX_COUNT } from "./attachment-schema";

export const MAX_REFERENCE_LINKS = 5;

export const componentRequestSchema = z.object({
  attachments: z.array(z.url()).max(ATTACHMENT_MAX_COUNT),
  credit: z
    .object({ name: z.string().trim().max(80), url: z.string().trim().max(200) })
    .refine((credit) => !credit.url || z.url().safeParse(credit.url).success, {
      message: "Credit link must be a full URL",
      path: ["url"],
    })
    .refine((credit) => !credit.url || credit.name, {
      message: "Add a name to go with the link",
      path: ["name"],
    }),
  description: z.string().trim().min(20, "Describe the interaction, not just the widget").max(2000),
  name: z.string().trim().min(2, "Give it a name").max(80),
  references: z
    .array(z.url("Each reference must be a full URL"))
    .max(MAX_REFERENCE_LINKS, `At most ${MAX_REFERENCE_LINKS} links`),
  website: z.string().max(200).optional(),
});

export type ComponentRequest = z.infer<typeof componentRequestSchema>;
