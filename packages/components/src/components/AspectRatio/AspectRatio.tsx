import React from "react";
import { classNames, responsiveVariables } from "utilities/helpers";
import type * as T from "./AspectRatio.types";
import s from "./AspectRatio.module.css";

const AspectRatio = (props: T.Props) => {
  const { children, ratio, className, attributes } = props;
  const rootClassNames = classNames(s.root, className);

  return (
    <div
      {...attributes}
      className={rootClassNames}
      style={{ ...responsiveVariables("--_r", ratio) } as React.CSSProperties}
    >
      {children}
    </div>
  );
};

export default AspectRatio;
