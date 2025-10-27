"use client";

import type { ReactNode } from "react";
import type { BundledLanguage } from "shiki";
import { useMemo, useState } from "react";
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
import { CodeBlock } from "@repo/ui/code-block";
import { Tree, TreeItem, TreeItemLabel } from "@repo/ui/tree";

import type { LocalContentComponent } from "@repo/api/content/content-schema";
import { getFiles } from "./sandpack";

const ROOT_ID = ".";
const INDENT = 20;

type Item = {
  name: string;
  path: string;
  isFolder: boolean;
  children?: string[];
};

// Detect language from file path
const getLanguageFromPath = (path: string): BundledLanguage => {
  const ext = path.split(".").pop()?.toLowerCase();
  const extMap: Record<string, BundledLanguage> = {
    tsx: "tsx",
    ts: "ts",
    jsx: "jsx",
    js: "js",
    css: "css",
    scss: "scss",
    sass: "sass",
    json: "json",
    md: "md",
    html: "html",
    vue: "vue",
    py: "py",
    java: "java",
    cpp: "cpp",
    c: "c",
    cs: "cs",
    php: "php",
    rb: "rb",
    go: "go",
    rs: "rust",
    sh: "bash",
    yaml: "yaml",
    yml: "yaml",
  };

  return extMap[ext ?? ""] ?? "tsx";
};

function getFileIcon(
  extension: string | undefined,
  className: string,
): ReactNode {
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

// Convert sourceCode record into a tree structure
const buildFileTree = (
  files: Record<string, { code: string }>,
): Record<string, Item> => {
  const tree: Record<string, Item> = {};
  const pathSet = new Set<string>();
  const rootChildren: string[] = [];

  // Add all paths to the set, including parent directories
  for (const filePath of Object.keys(files)) {
    // Normalize path: remove leading slash and filter out empty parts
    const normalizedPath = filePath.startsWith("/")
      ? filePath.slice(1)
      : filePath;
    const parts = normalizedPath.split("/").filter((part) => part !== "");
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      const previousPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!pathSet.has(currentPath)) {
        pathSet.add(currentPath);

        // If it's the last part, it's a file
        const isLastPart = i === parts.length - 1;

        // Track root-level items (only items without a parent should be in rootChildren)
        if (!previousPath && !rootChildren.includes(currentPath)) {
          rootChildren.push(currentPath);
        }

        if (previousPath) {
          tree[previousPath] ??= {
            name: previousPath.split("/").pop() ?? previousPath,
            path: previousPath,
            isFolder: true,
            children: [],
          };

          if (!tree[previousPath].children?.includes(currentPath)) {
            tree[previousPath].children?.push(currentPath);
          }
        }

        tree[currentPath] = {
          name: part,
          path: currentPath,
          isFolder: !isLastPart,
          children: isLastPart ? undefined : [],
        };
      }
    }
  }

  // Create a dummy root folder that contains all root-level items
  tree["."] = {
    name: "root",
    path: ".",
    isFolder: true,
    children: rootChildren,
  };

  return tree;
};

type CodePreviewProps = {
  contentComponent: LocalContentComponent;
};

export const CodePreview = ({ contentComponent }: CodePreviewProps) => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Build all files for code lookup
  const allFiles = useMemo(
    () => getFiles(contentComponent),
    [contentComponent],
  );
  const items = useMemo(() => buildFileTree(allFiles), [allFiles]);

  const tree = useTree<Item>({
    indent: INDENT,
    rootItemId: ROOT_ID,
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => item.getItemData().isFolder,
    dataLoader: {
      getItem: (itemId) => items[itemId]!,
      getChildren: (itemId) => items[itemId]?.children ?? [],
    },
    features: [syncDataLoaderFeature, hotkeysCoreFeature],
  });

  const handleItemClick = (item: Item) => {
    if (!item.isFolder) {
      setSelectedPath(item.path);
    }
  };

  const selectedCode = useMemo(() => {
    if (!selectedPath) return contentComponent.previewCode;
    return (
      allFiles[selectedPath]?.code ??
      allFiles[`/${selectedPath}`]?.code ??
      allFiles[selectedPath.replace(/^\//, "")]?.code ??
      ""
    );
  }, [selectedPath, allFiles, contentComponent.previewCode]);

  const codeLanguage = useMemo<BundledLanguage>(
    () => (selectedPath ? getLanguageFromPath(selectedPath) : "tsx"),
    [selectedPath],
  );

  return (
    <div className="mt-4 grid h-[90dvh] grid-cols-[200px_1fr] border-t">
      <Tree className="overflow-auto border-r" indent={INDENT} tree={tree}>
        <AssistiveTreeDescription tree={tree} />
        {tree.getItems().map((item) => {
          const itemData = item.getItemData();

          return (
            <TreeItem key={item.getId()} item={item} className="pb-0!">
              <TreeItemLabel
                className="rounded-none py-1"
                onClick={() => handleItemClick(itemData)}
              >
                <span className="flex items-center gap-2">
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
      <CodeBlock
        code={selectedCode}
        language={codeLanguage}
        containerClassName="overflow-auto [&>*]:h-full"
        preClassName="p-4 min-h-full"
      />
    </div>
  );
};
