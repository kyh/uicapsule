"use client";

import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import type { SourceFile } from "@/lib/content/content-schema";

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

export const downloadZip = async (slug: string, sourceFiles: SourceFile[]) => {
  const { strToU8, zipSync } = await import("fflate");

  const archive = zipSync(
    Object.fromEntries(sourceFiles.map(({ path, code }) => [path, strToU8(code)])),
  );

  const url = URL.createObjectURL(new Blob([archive], { type: "application/zip" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${slug}.zip`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const installCommand = (slug: string) => `npx shadcn@latest add @uicapsule/${slug}`;
