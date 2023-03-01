"use client";

import React from "react";
import type * as T from "./Flyout.types";
import { useFlyoutContext } from "./Flyout.context";

const FlyoutTrigger = (props: T.TriggerProps) => {
  const { children } = props;
  const {
    id,
    triggerElRef,
    triggerType,
    flyout,
    handleFocus,
    handleBlur,
    handleMouseEnter,
    handleMouseLeave,
    handleClick,
    trapFocusMode,
  } = useFlyoutContext();

  let childrenAttributes: T.TriggerAttributes;

  if (triggerType === "hover") {
    childrenAttributes = {
      onBlur: handleBlur,
      ref: triggerElRef,
      onFocus: handleFocus,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      "aria-describedby": id,
    };
  } else {
    childrenAttributes = {
      onBlur: handleBlur,
      ref: triggerElRef,
      onClick: handleClick,
      "aria-haspopup": trapFocusMode === "dialog" ? "dialog" : "menu",
      "aria-expanded": flyout.status !== "idle",
      "aria-controls": flyout.status !== "idle" ? id : undefined,
    };
  }

  return <>{children(childrenAttributes)}</>;
};

export default FlyoutTrigger;
