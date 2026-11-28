import type { AnnotationTool } from "@repo/inspector/annotation-layer";

/** What a key press asks the bar to do. */
export type BarCommand =
  | { kind: "back" }
  | { kind: "request" }
  | { kind: "visible" }
  | { kind: "tool"; tool: AnnotationTool | "inspect" | "last-annotate" };

const TOOL_KEYS = new Map<string, AnnotationTool>([
  ["d", "arrow"],
  ["n", "pen"],
  ["s", "select"],
  ["t", "text"],
]);

/** The letter each annotate tool answers to, for its tooltip. */
export const toolKey = (tool: AnnotationTool) =>
  [...TOOL_KEYS].find(([, value]) => value === tool)?.[0].toUpperCase() ?? "";

/** The bar's keyboard map: letters pick tools, 1 and 2 switch groups, Enter requests. */
export const barCommand = (event: {
  altKey: boolean;
  ctrlKey: boolean;
  key: string;
  metaKey: boolean;
}) => {
  const key = event.key.toLowerCase();
  const command = event.metaKey || event.ctrlKey;
  const plain = !command && !event.altKey;
  const tool = TOOL_KEYS.get(key);

  if (event.key === "Escape") {
    return { kind: "back" } satisfies BarCommand;
  }

  if (command || !plain) {
    return null;
  }

  if (event.key === "Enter") {
    return { kind: "request" } satisfies BarCommand;
  }

  if (key === "v") {
    return { kind: "visible" } satisfies BarCommand;
  }

  if (key === "i" || key === "1") {
    return { kind: "tool", tool: "inspect" } satisfies BarCommand;
  }

  if (key === "2") {
    return { kind: "tool", tool: "last-annotate" } satisfies BarCommand;
  }

  return tool === undefined ? null : ({ kind: "tool", tool } satisfies BarCommand);
};
