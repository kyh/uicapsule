import type { AnnotationTool } from "@repo/inspector/annotation-layer";
import {
  BarDivider,
  InspectBar,
  ToolButton,
  ToolGroup,
  ToolStage,
  ToolSwitch,
} from "@repo/inspector/inspect-bar";
import type { SwitchOption } from "@repo/inspector/inspect-bar";
import {
  ArrowUp,
  Fullscreen,
  MousePointer2,
  MoveUpRight,
  Pencil,
  Scan,
  Signature,
  SquareDashedMousePointer,
  Type,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import { toolKey } from "./bar-keys";

/** The bar's tools: one picks what to capture, the rest draw on top of it. */
export type BarTool = "inspect" | AnnotationTool;

const ANNOTATE_TOOLS = [
  { icon: <MousePointer2 />, label: "Select", tool: "select" },
  { icon: <MoveUpRight />, label: "Arrow", tool: "arrow" },
  { icon: <Pencil />, label: "Pen", tool: "pen" },
  { icon: <Type />, label: "Text", tool: "text" },
] satisfies { icon: ReactNode; label: string; tool: AnnotationTool }[];

const GROUPS: SwitchOption<"annotate" | "capture">[] = [
  { icon: <Scan />, label: "Capture", shortcut: "1", value: "capture" },
  { icon: <Signature />, label: "Annotate", shortcut: "2", value: "annotate" },
];

/**
 * The inspect bar the extension shows: a switch between the capture and annotate tools, that
 * group's tools, then Request and Close.
 */
export const CaptureBar = ({
  onClose,
  onGroup,
  onRequest,
  onTool,
  onVisible,
  tool,
  visible,
}: {
  onClose: () => void;
  onGroup: (group: "annotate" | "capture") => void;
  onRequest: () => void;
  onTool: (tool: BarTool) => void;
  onVisible: () => void;
  tool: BarTool;
  visible: boolean;
}) => {
  const capturing = tool === "inspect";

  return (
    <InspectBar label="UICapsule">
      <ToolSwitch
        label="Tool group"
        options={GROUPS}
        value={capturing ? "capture" : "annotate"}
        onChange={onGroup}
      />
      <BarDivider />
      <ToolStage
        open={capturing ? "capture" : "annotate"}
        panels={[
          {
            content: (
              <ToolGroup label="Capture">
                <ToolButton
                  icon={<SquareDashedMousePointer />}
                  label="Inspect"
                  pressed={capturing && !visible}
                  shortcut="I"
                  onPress={() => {
                    onTool("inspect");
                  }}
                />
                <ToolButton
                  icon={<Fullscreen />}
                  label="Visible area"
                  pressed={capturing && visible}
                  shortcut="V"
                  onPress={onVisible}
                />
              </ToolGroup>
            ),
            value: "capture",
          },
          {
            content: (
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
            ),
            value: "annotate",
          },
        ]}
      />
      <BarDivider />
      <ToolGroup label="Request">
        <ToolButton icon={<ArrowUp />} label="Request" shortcut="↵" onPress={onRequest} />
        <ToolButton icon={<X />} label="Close" shortcut="Esc" onPress={onClose} />
      </ToolGroup>
    </InspectBar>
  );
};
