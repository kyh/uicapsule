import React from "react";
import { classNames } from "utilities/helpers";
import Flyout, { FlyoutRefProps } from "components/_private/Flyout";
import type * as T from "./Popover.types";
import s from "./Popover.module.css";
import getPaddingStyles from "styles/padding";

const Popover = (props: T.Props) => {
  const {
    id,
    forcePosition,
    onOpen,
    onClose,
    active,
    defaultActive,
    children,
    width,
    padding = 4,
    triggerType = "click",
    position = "bottom",
  } = props;
  const flyoutRef = React.useRef<FlyoutRefProps | null>(null);
  const trapFocusMode =
    props.trapFocusMode ||
    (triggerType === "hover" ? "content-menu" : undefined);
  const paddingStyles = getPaddingStyles(padding);
  const contentClassName = classNames(
    s.root,
    !!width && s["--has-width"],
    paddingStyles?.classNames
  );

  return (
    // @ts-ignore
    <Flyout
      id={id}
      ref={flyoutRef}
      position={position}
      forcePosition={forcePosition}
      onOpen={onOpen}
      onClose={onClose}
      trapFocusMode={trapFocusMode}
      triggerType={triggerType}
      active={active}
      defaultActive={defaultActive}
      width={width}
      contentClassName={contentClassName}
      contentAttributes={{ style: { ...paddingStyles?.variables } }}
    >
      {children}
    </Flyout>
  );
};

Popover.Content = Flyout.Content;
Popover.Trigger = Flyout.Trigger;
export default Popover;
