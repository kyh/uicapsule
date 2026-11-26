"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  RiBracesLine,
  RiCodeSSlashLine,
  RiFileLine,
  RiFileTextLine,
  RiHashtag,
  RiImageLine,
  RiReactjsLine,
} from "@remixicon/react";
import { DownloadIcon, ExternalLinkIcon, XIcon } from "lucide-react";
import type { BundledLanguage } from "shiki";
import { Button } from "@repo/ui/components/button";
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockItem,
} from "@repo/ui/components/code-block";
import { toast } from "@repo/ui/components/toast";
import { cn } from "cn";

import type { ContentComponentSummary, SourceFile } from "@/lib/content/content-schema";
import { downloadZip, sourceFilesQuery } from "./source-files";
import { ToolbarButton } from "./toolbar-button";

const extensionToLanguageMap = {
  cjs: "javascript",
  css: "css",
  html: "html",
  js: "javascript",
  json: "json",
  jsx: "jsx",
  md: "markdown",
  mdx: "mdx",
  mjs: "javascript",
  scss: "scss",
  sh: "bash",
  svg: "xml",
  ts: "typescript",
  tsx: "tsx",
  yaml: "yaml",
  yml: "yaml",
} satisfies Record<string, BundledLanguage>;

const isKnownExtension = (ext: string): ext is keyof typeof extensionToLanguageMap =>
  ext in extensionToLanguageMap;

const extensionOf = (path: string) => path.split(".").pop()?.toLowerCase() ?? "";

const languageOf = (path: string) => {
  const ext = extensionOf(path);

  return isKnownExtension(ext) ? extensionToLanguageMap[ext] : "txt";
};

const FileIcon = ({ path }: { path: string }) => {
  const className = "text-muted-foreground size-3.5 shrink-0";

  switch (extensionOf(path)) {
    case "tsx":
    case "jsx": {
      return <RiReactjsLine className={className} />;
    }

    case "ts":
    case "js":
    case "mjs": {
      return <RiCodeSSlashLine className={className} />;
    }

    case "css":
    case "scss": {
      return <RiHashtag className={className} />;
    }

    case "json": {
      return <RiBracesLine className={className} />;
    }

    case "svg":
    case "png":
    case "jpg": {
      return <RiImageLine className={className} />;
    }

    case "md": {
      return <RiFileTextLine className={className} />;
    }

    default: {
      return <RiFileLine className={className} />;
    }
  }
};

const fileRank = (slug: string, path: string) => {
  if (path === `${slug}.tsx`) {
    return 0;
  }

  if (path === "package.json") {
    return 3;
  }

  if (path === "preview.tsx") {
    return 2;
  }

  return 1;
};

const orderFiles = (slug: string, files: SourceFile[]) =>
  files.toSorted(
    (a, b) => fileRank(slug, a.path) - fileRank(slug, b.path) || a.path.localeCompare(b.path),
  );

interface CodeDockProps {
  component: ContentComponentSummary;
  onClose: () => void;
}

const DockMessage = ({ children }: { children: ReactNode }) => (
  <div className="text-muted-foreground flex flex-1 items-center justify-center p-6 text-sm">
    {children}
  </div>
);

const LocalCodeDock = ({ slug, onClose }: { slug: string; onClose: () => void }) => {
  const { data, isError } = useQuery(sourceFilesQuery(slug));
  const files = useMemo(() => (data ? orderFiles(slug, data) : []), [data, slug]);
  const [selected, setSelected] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const file = files.find((f) => f.path === selected) ?? files[0];
  const language = languageOf(file?.path ?? "");

  const onDownload = async () => {
    if (!data || downloading) {
      return;
    }

    setDownloading(true);

    try {
      await downloadZip(slug, data);
      toast.success(`${slug}.zip downloaded`);
    } catch (error) {
      console.error("Failed to create zip file:", error);
      toast.error("Failed to create zip file", { description: "Please try again later" });
    }

    setDownloading(false);
  };

  return (
    <CodeBlock
      data={file ? [{ code: file.code, filename: file.path, language }] : []}
      value={language}
      className="flex h-full flex-col rounded-none border-0 bg-transparent"
    >
      <div className="flex h-10 shrink-0 items-center gap-2 border-b px-2">
        <div
          role="tablist"
          aria-label="Source files"
          className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]"
        >
          {files.map(({ path }) => {
            const active = path === file?.path;

            return (
              <button
                key={path}
                type="button"
                role="tab"
                aria-selected={active}
                className={cn(
                  "text-muted-foreground hover:text-foreground flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs transition-colors",
                  active && "bg-accent text-foreground",
                )}
                onClick={() => {
                  setSelected(path);
                }}
              >
                <FileIcon path={path} />
                {path}
              </button>
            );
          })}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <CodeBlockCopyButton
            className="size-7"
            disabled={!file}
            onCopy={() => {
              toast.success(`Copied ${file?.path ?? "file"}`);
            }}
          />
          <ToolbarButton
            label="Download .zip"
            disabled={!data}
            loading={downloading}
            onClick={() => {
              void onDownload();
            }}
          >
            <DownloadIcon />
          </ToolbarButton>
          <ToolbarButton label="Hide code" onClick={onClose}>
            <XIcon />
          </ToolbarButton>
        </div>
      </div>
      {isError && <DockMessage>Couldn&apos;t load the source. Try again later.</DockMessage>}
      {!isError && !file && <DockMessage>Loading source…</DockMessage>}
      {file && (
        <CodeBlockBody className="min-h-0 flex-1 overflow-auto text-[13px] select-text">
          {(item) => (
            <CodeBlockItem key={item.filename} value={item.language} className="min-h-full">
              <CodeBlockContent language={language}>{item.code}</CodeBlockContent>
            </CodeBlockItem>
          )}
        </CodeBlockBody>
      )}
    </CodeBlock>
  );
};

export const CodeDock = ({ component, onClose }: CodeDockProps) => {
  if (component.type === "local") {
    return <LocalCodeDock key={component.slug} slug={component.slug} onClose={onClose} />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center justify-end border-b px-2">
        <ToolbarButton label="Hide code" onClick={onClose}>
          <XIcon />
        </ToolbarButton>
      </div>
      <DockMessage>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={
            <a href={component.sourceUrl} target="_blank" rel="noreferrer">
              View source on GitHub
              <ExternalLinkIcon />
            </a>
          }
        />
      </DockMessage>
    </div>
  );
};
