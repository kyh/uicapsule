import type { AnnotationTool } from "@repo/inspector/annotation-layer";
import {
  BarAction,
  BarDivider,
  InspectBar,
  ToolButton,
  ToolGroup,
} from "@repo/inspector/inspect-bar";
import {
  ArrowUp,
  Fullscreen,
  MousePointer2,
  MoveUpRight,
  Pencil,
  Scan,
  Settings,
  Signature,
  SquareDashedMousePointer,
  Type,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import { toolKey } from "./bar-keys";

/** The bar's tools: one picks what to capture, the rest draw on top of it. */
export type BarTool = "inspect" | AnnotationTool;

const MAC = navigator.userAgent.includes("Mac");

const ANNOTATE_TOOLS = [
  { icon: <MousePointer2 />, label: "Select", tool: "select" },
  { icon: <MoveUpRight />, label: "Arrow", tool: "arrow" },
  { icon: <Pencil />, label: "Pen", tool: "pen" },
  { icon: <Type />, label: "Text", tool: "text" },
] satisfies { icon: ReactNode; label: string; tool: AnnotationTool }[];

/**
 * The inspect bar the extension shows: a switch between the capture and annotate tools, that
 * group's tools, then Request, Settings and Close.
 */
export const CaptureBar = ({
  onClose,
  onGroup,
  onRequest,
  onSettings,
  onTool,
  onVisible,
  tool,
  visible,
}: {
  onClose: () => void;
  onGroup: (group: "annotate" | "capture") => void;
  onRequest: () => void;
  onSettings: () => void;
  onTool: (tool: BarTool) => void;
  onVisible: () => void;
  tool: BarTool;
  visible: boolean;
}) => {
  const capturing = tool === "inspect";

  return (
    <InspectBar label="UICapsule">
      <ToolGroup label="Tool group">
        <ToolButton
          icon={<Scan />}
          label="Capture"
          pressed={capturing}
          shortcut="1"
          onPress={() => {
            onGroup("capture");
          }}
        />
        <ToolButton
          icon={<Signature />}
          label="Annotate"
          pressed={!capturing}
          shortcut="2"
          onPress={() => {
            onGroup("annotate");
          }}
        />
      </ToolGroup>
      <BarDivider />
      {capturing ? (
        <ToolGroup label="Capture">
          <ToolButton
            icon={<SquareDashedMousePointer />}
            label="Inspect"
            pressed={!visible}
            shortcut="I"
            onPress={() => {
              onTool("inspect");
            }}
          />
          <ToolButton
            icon={<Fullscreen />}
            label="Visible area"
            pressed={visible}
            shortcut="V"
            onPress={onVisible}
          />
        </ToolGroup>
      ) : (
        <ToolGroup label="Annotate">
          {ANNOTATE_TOOLS.map((entry) => (
            <ToolButton
              key={entry.tool}
              icon={entry.icon}
              label={entry.label}
              pressed={tool === entry.tool}
              shortcut={toolKey(entry.tool)}
              onPress={() => {
                onTool(entry.tool);
              }}
            />
          ))}
        </ToolGroup>
      )}
      <BarDivider />
      <ToolGroup label="Request and settings">
        <BarAction
          icon={<ArrowUp />}
          shortcut="↵"
          tip="File a component request"
          onPress={onRequest}
        >
          Request
        </BarAction>
        <ToolButton
          icon={<Settings />}
          label="Settings"
          shortcut={MAC ? "⌘," : "Ctrl+,"}
          onPress={onSettings}
        />
        <ToolButton icon={<X />} label="Close" shortcut="Esc" onPress={onClose} />
      </ToolGroup>
    </InspectBar>
  );
};
