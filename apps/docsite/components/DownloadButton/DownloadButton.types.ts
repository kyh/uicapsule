import type { ButtonProps } from "@uicapsule/components";

export type Props = Omit<ButtonProps, "type"> & {
  type: "react" | "figma" | "source";
  version?: string;
};
