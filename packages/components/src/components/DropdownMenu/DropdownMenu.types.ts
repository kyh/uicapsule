import React from "react";
import { PopoverProps } from "components/Popover";

export type Props = Partial<
  Pick<
    PopoverProps,
    | "children"
    | "position"
    | "forcePosition"
    | "onOpen"
    | "onClose"
    | "active"
    | "defaultActive"
    | "width"
  >
>;

export type ContentProps = {
  children: React.ReactNode;
};

export type SectionProps = {
  children: React.ReactNode;
};
