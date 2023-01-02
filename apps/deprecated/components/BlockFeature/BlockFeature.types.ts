import React from "react";
import { ButtonProps } from "@uicapsule/components";

export type Props = {
  horizontal?: boolean;
  autoHeightPreview?: boolean;
  bleedPreview?: boolean;
  children?: React.ReactNode;
  title: string;
  text: string;
  action?: Omit<ButtonProps, "color">;
};
