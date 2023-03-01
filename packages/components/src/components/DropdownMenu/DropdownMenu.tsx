"use client";

import React from "react";
import Popover from "components/Popover";
import MenuItem, { MenuItemProps } from "components/MenuItem";
import { useFlyoutContext } from "components/_private/Flyout";
import type * as T from "./DropdownMenu.types";
import s from "./DropdownMenu.module.css";

const DropdownMenu = (props: T.Props) => {
  const { children, position = "bottom-start", ...popoverProps } = props;

  return (
    <Popover
      {...popoverProps}
      position={position}
      padding={0}
      trapFocusMode="action-menu"
      triggerType="click"
    >
      {children}
    </Popover>
  );
};

const DropdownMenuContent = (props: T.ContentProps) => {
  const { children } = props;

  return (
    <Popover.Content>
      <div className={s.menu} role="menu">
        {children}
      </div>
    </Popover.Content>
  );
};

const DropdownMenuSection = (props: T.SectionProps) => {
  const { children } = props;

  return (
    <div className={s.section} role="group">
      {children}
    </div>
  );
};

const DropdownMenuItem = (props: MenuItemProps) => {
  const { onClick } = props;
  const { handleClose } = useFlyoutContext();

  const handleClick = (
    e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>
  ) => {
    if (handleClose) handleClose();
    if (onClick) onClick(e);
  };

  return (
    <MenuItem
      {...props}
      roundedCorners
      className={s.item}
      size="small"
      attributes={{ ...props.attributes, role: "menuitem" }}
      onClick={handleClick}
    />
  );
};

DropdownMenu.Trigger = Popover.Trigger;
DropdownMenu.Content = DropdownMenuContent;
DropdownMenu.Section = DropdownMenuSection;
DropdownMenu.Item = DropdownMenuItem;
export default DropdownMenu;
