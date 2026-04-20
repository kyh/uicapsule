import { z } from "zod";

export const slugify = (str: string) => {
  return str
    .replace(/^\s+|\s+$/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

type Primitive = string | number | boolean | null;

type JsonType = Primitive | { [key: PropertyKey]: JsonType } | JsonType[];

export const zJsonString = z.string().transform((str, ctx): JsonType => {
  try {
    return JSON.parse(str) as JsonType;
  } catch {
    ctx.addIssue({ code: "custom", message: "Invalid JSON" });
    return z.NEVER;
  }
});
