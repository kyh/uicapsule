import React from "react";
import { classNames } from "utilities/helpers";
import type * as T from "./ActionBar.types";
import s from "./ActionBar.module.css";

const ActionBar = (props: T.Props) => {
  const {
    position = "bottom",
    size,
    children,
    elevated,
    className,
    attributes,
  } = props;
  const rootClassNames = classNames(
    s.root,
    elevated && s["--elevated"],
    position && s[`--position-${position}`],
    size && s[`--size-${size}`],
    className
  );

  return (
    <div {...attributes} className={rootClassNames}>
      {children}
    </div>
  );
};

export default ActionBar;
