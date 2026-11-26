"use client";

import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

const sourceFilesSchema = z.array(z.object({ code: z.string(), path: z.string() }));

export const sourceFilesQuery = (slug: string) =>
  queryOptions({
    queryFn: async () => {
      const res = await fetch(`/api/content/${slug}`);

      if (!res.ok) {
        throw new Error(`Failed to load source files for ${slug}`);
      }

      return sourceFilesSchema
        .parse(await res.json())
        .map((file) => ({ ...file, path: file.path.replace(/^\/+/u, "") }));
    },
    queryKey: ["content-source-files", slug],
    staleTime: Infinity,
  });

export const installCommand = (slug: string) => `npx shadcn@latest add @uicapsule/${slug}`;
