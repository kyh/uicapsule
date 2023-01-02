import React from "react";
import { classNames, responsiveVariables } from "utilities/helpers";
import type * as T from "./Icon.types";
import s from "./Icon.module.css";

const Icon = (props: T.Props) => {
  const {
    svg: Component,
    className,
    color,
    size,
    autoWidth,
    attributes,
  } = props;
  const rootClassName = classNames(
    s.root,
    className,
    color && s[`--color-${color}`],
    autoWidth && s["--auto"]
  );

  const icon = typeof Component === "object" ? Component : <Component />;
  const style = { ...attributes?.style, ...responsiveVariables("--_s", size) };

  return (
    // All icons are decorative, a11y attributes should be set for buttons wrapping them
    <span
      {...attributes}
      aria-hidden="true"
      className={rootClassName}
      style={style}
    >
      {React.cloneElement(icon, { focusable: false })}
    </span>
  );
};

export default Icon;
