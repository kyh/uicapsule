"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { frame } from "motion/react";
import type { ReactNode } from "react";
import type { BundledLanguage, SpecialLanguage } from "shiki";

import { hotkeysCoreFeature, syncDataLoaderFeature } from "@headless-tree/core";
import { AssistiveTreeDescription, useTree } from "@headless-tree/react";
import {
  RiBracesLine,
  RiCodeSSlashLine,
  RiFileLine,
  RiFileTextLine,
  RiImageLine,
  RiReactjsLine,
} from "@remixicon/react";
import { Button } from "@repo/ui/components/button";
import {
  CodeBlock,
  CodeBlockBody,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockItem,
} from "@repo/ui/components/code-block";
import { toast } from "@repo/ui/components/toast";
import { Tree, TreeItem, TreeItemLabel } from "@repo/ui/components/tree";
import { cn } from "cn";

import type { SourceFile } from "@/lib/content/content-schema";

const ROOT_ID = ".";
const INDENT = 20;

type Item = { name: string; path: string } & (
  | { isFolder: true; children: string[] }
  | { isFolder: false }
);

const extensionToLanguageMap = {
  tsx: "tsx",
  ts: "typescript",
  jsx: "jsx",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  css: "css",
  scss: "scss",
  html: "html",
  md: "markdown",
  mdx: "mdx",
  svg: "xml",
  yaml: "yaml",
  yml: "yaml",
  sh: "bash",
} satisfies Record<string, BundledLanguage>;

const isKnownExtension = (ext: string): ext is keyof typeof extensionToLanguageMap =>
  ext in extensionToLanguageMap;

const getLanguageFromPath = (path: string): BundledLanguage | SpecialLanguage => {
  const ext = path.split(".").pop()?.toLowerCase();
  return ext != null && isKnownExtension(ext) ? extensionToLanguageMap[ext] : "txt";
};

function getFileIcon(extension: string | undefined, className: string): ReactNode {
  switch (extension) {
    case "tsx":
    case "jsx":
      return <RiReactjsLine className={className} />;
    case "ts":
    case "js":
    case "mjs":
      return <RiCodeSSlashLine className={className} />;
    case "json":
      return <RiBracesLine className={className} />;
    case "svg":
    case "ico":
    case "png":
    case "jpg":
      return <RiImageLine className={className} />;
    case "md":
      return <RiFileTextLine className={className} />;
    default:
      return <RiFileLine className={className} />;
  }
}

const buildFileTree = (files: SourceFile[]) => {
  const tree: Record<string, Item> = {};
  const rootChildren = new Set<string>();

  for (const { path } of files) {
    const parts = path.split("/").filter(Boolean);

    if (parts.length === 0) continue;

    let parentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      const currentPath = parentPath ? `${parentPath}/${part}` : part;
      const isFile = i === parts.length - 1;

      if (!(currentPath in tree)) {
        tree[currentPath] = isFile
          ? { name: part, path: currentPath, isFolder: false }
          : { name: part, path: currentPath, isFolder: true, children: [] };

        if (!parentPath) {
          rootChildren.add(currentPath);
        }
      }

      if (parentPath) {
        const parent = tree[parentPath];
        if (parent?.isFolder) {
          const children = parent.children;
          if (!children.includes(currentPath)) {
            children.push(currentPath);
          }
        }
      }

      parentPath = currentPath;
    }
  }

  tree["."] = {
    name: "root",
    path: ".",
    isFolder: true,
    children: Array.from(rootChildren),
  };

  return tree;
};

type CodePreviewProps = {
  sourceFiles: SourceFile[];
};

export const CodePreview = ({ sourceFiles }: CodePreviewProps) => {
  const { containerRef, handleMouseDown } = useResizableSidebar();
  const files = useMemo(
    () => sourceFiles.map((file) => ({ ...file, path: file.path.replace(/^\/+/, "") })),
    [sourceFiles],
  );
  const [selectedPath, setSelectedPath] = useState(files[0]?.path ?? "");
  const items = useMemo(() => buildFileTree(files), [files]);

  const tree = useTree<Item>({
    indent: INDENT,
    rootItemId: ROOT_ID,
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => item.getItemData().isFolder,
    dataLoader: {
      getItem: (itemId) =>
        items[itemId] ?? {
          name: "",
          path: itemId,
          isFolder: true,
          children: [],
        },
      getChildren: (itemId) => {
        const item = items[itemId];
        return item?.isFolder ? item.children : [];
      },
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });

  const selectedFile = files.find((file) => file.path === selectedPath) ?? files[0];
  const selectedCode = selectedFile?.code ?? "";
  const codeLanguage = getLanguageFromPath(selectedFile?.path ?? "");

  return (
    <div
      ref={containerRef}
      className="mt-4 flex h-[90dvh] flex-col border-t md:grid"
      style={{ gridTemplateColumns: "var(--sidebar-width, 240px) 1fr" }}
    >
      <div className="relative hidden md:flex">
        <Tree className="flex-1 overflow-auto border-r" indent={INDENT} tree={tree}>
          <AssistiveTreeDescription tree={tree} />
          {tree.getItems().map((item) => {
            const itemData = item.getItemData();

            return (
              <TreeItem key={item.getId()} item={item} className="pb-0!">
                <TreeItemLabel
                  className={cn(
                    "rounded-none py-1",
                    selectedPath === itemData.path && "text-primary",
                  )}
                  onClick={() => {
                    if (!itemData.isFolder) setSelectedPath(itemData.path);
                  }}
                >
                  <span className="flex items-center gap-2 truncate">
                    {!item.isFolder() &&
                      getFileIcon(
                        itemData.path.split(".").pop()?.toLowerCase(),
                        "text-muted-foreground pointer-events-none size-4",
                      )}
                    {item.getItemName()}
                  </span>
                </TreeItemLabel>
              </TreeItem>
            );
          })}
        </Tree>
        <div
          className="hover:bg-primary/50 active:bg-primary/80 absolute top-0 -right-0.5 h-full w-1 cursor-col-resize bg-transparent transition-colors duration-200"
          onMouseDown={handleMouseDown}
        />
      </div>
      <div className="flex overflow-x-auto border-b md:hidden">
        {files.map(({ path }) => (
          <Button
            className={cn("shrink-0", selectedPath === path && "text-primary")}
            variant="ghost"
            size="sm"
            key={path}
            onClick={() => setSelectedPath(path)}
          >
            {path}
          </Button>
        ))}
      </div>
      <CodeBlock
        data={[{ language: codeLanguage, filename: selectedPath, code: selectedCode }]}
        value={codeLanguage}
        className="relative flex-1 overflow-auto rounded-none border-0 [&>div]:h-full"
      >
        <CodeBlockBody>
          {(item) => (
            <CodeBlockItem key={item.language} value={item.language}>
              <CodeBlockContent language={codeLanguage}>{item.code}</CodeBlockContent>
            </CodeBlockItem>
          )}
        </CodeBlockBody>
        <CodeBlockCopyButton
          className="absolute top-2 right-3"
          onCopy={() => {
            toast.success("Copied to clipboard");
          }}
        />
      </CodeBlock>
    </div>
  );
};

// Keep width local to the grid; updating :root would restyle the whole page during a drag.
const useResizableSidebar = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const widthRef = useRef(240);

  const handleMouseDown = (e: ReactMouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startWidth: widthRef.current };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    containerRef.current?.style.setProperty("--sidebar-width", `${widthRef.current}px`);

    const handleMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      widthRef.current = Math.min(Math.max(drag.startWidth + e.clientX - drag.startX, 100), 300);

      frame.update(() => {
        containerRef.current?.style.setProperty("--sidebar-width", `${widthRef.current}px`);
      });
    };

    const handleMouseUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

  return {
    containerRef,
    handleMouseDown,
  };
};
