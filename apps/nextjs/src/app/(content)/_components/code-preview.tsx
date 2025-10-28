"use client";

import type { ReactNode } from "react";
import type { BundledLanguage } from "shiki";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { Button } from "@repo/ui/button";
import {
  CodeBlock,
  CodeBlockCopyButton,
  extensionToLanguageMap,
} from "@repo/ui/code-block";
import { toast } from "@repo/ui/toast";
import { Tree, TreeItem, TreeItemLabel } from "@repo/ui/tree";
import { cn } from "@repo/ui/utils";

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
  return extensionToLanguageMap[ext ?? ""] ?? ("txt" as BundledLanguage);
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
  const rootChildren = new Set<string>();

  // Process each file path
  for (const filePath of Object.keys(files)) {
    // Normalize path: remove leading slash and split into parts
    const normalizedPath = filePath.startsWith("/")
      ? filePath.slice(1)
      : filePath;
    const parts = normalizedPath.split("/").filter(Boolean);

    if (parts.length === 0) continue;

    let parentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;

      const currentPath = parentPath ? `${parentPath}/${part}` : part;
      const isFile = i === parts.length - 1;

      // Create node if it doesn't exist
      if (!(currentPath in tree)) {
        tree[currentPath] = {
          name: part,
          path: currentPath,
          isFolder: !isFile,
          children: !isFile ? [] : undefined,
        };

        // Track root-level items
        if (!parentPath) {
          rootChildren.add(currentPath);
        }
      }

      // Add to parent's children if parent exists
      if (parentPath) {
        const parent = tree[parentPath];
        if (parent?.children) {
          const children = parent.children;
          if (!children.includes(currentPath)) {
            children.push(currentPath);
          }
        }
      }

      parentPath = currentPath;
    }
  }

  // Create root node
  tree["."] = {
    name: "root",
    path: ".",
    isFolder: true,
    children: Array.from(rootChildren),
  };

  return tree;
};

type CodePreviewProps = {
  contentComponent: LocalContentComponent;
};

export const CodePreview = ({ contentComponent }: CodePreviewProps) => {
  const { handleMouseDown } = useResizableSidebar();
  const [selectedPath, setSelectedPath] = useState("App.tsx");

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
      getItem: (itemId) =>
        items[itemId] ?? {
          name: "",
          path: itemId,
          isFolder: true,
          children: [],
        },
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
    <div
      className="mt-4 flex h-[90dvh] flex-col border-t md:grid"
      style={{ gridTemplateColumns: "var(--sidebar-width, 280px) 1fr" }}
    >
      <div className="relative hidden md:flex">
        <Tree
          className="flex-1 overflow-auto border-r"
          indent={INDENT}
          tree={tree}
        >
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
                  onClick={() => handleItemClick(itemData)}
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
        {Object.keys(allFiles).map((path) => (
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
        code={selectedCode}
        language={codeLanguage}
        containerClassName="overflow-auto [&>*]:h-full flex-1"
        preClassName="py-3 px-2 min-h-full"
      />
      <CodeBlockCopyButton
        code={selectedCode}
        className="absolute top-2 right-3"
        onCopy={() => {
          toast.success("Copied to clipboard");
        }}
      />
    </div>
  );
};

type UseResizableSidebarOptions = {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
};

export const useResizableSidebar = ({
  defaultWidth = 240,
  minWidth = 100,
  maxWidth = 300,
}: UseResizableSidebarOptions = {}) => {
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const isResizingRef = useRef<boolean>(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    // Get current width from CSS variable
    const currentWidth = parseInt(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--sidebar-width")
        .replace("px", "") || defaultWidth.toString(),
    );
    startWidthRef.current = currentWidth;
  };

  useEffect(() => {
    // Set initial CSS variable value
    document.documentElement.style.setProperty(
      "--sidebar-width",
      `${defaultWidth}px`,
    );

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;

      const deltaX = e.clientX - startXRef.current;
      const newWidth = startWidthRef.current + deltaX;
      const clampedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth);

      // Set CSS variable directly
      document.documentElement.style.setProperty(
        "--sidebar-width",
        `${clampedWidth}px`,
      );
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    const handleMouseDownGlobal = () => {
      if (isResizingRef.current) {
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
      }
    };

    // Add event listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDownGlobal);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDownGlobal);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [defaultWidth, minWidth, maxWidth]);

  return {
    handleMouseDown,
  };
};
