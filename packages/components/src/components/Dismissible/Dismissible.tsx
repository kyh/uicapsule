import React from "react";
import { classNames } from "utilities/helpers";
import Button from "components/Button";
import IconClose from "icons/Close";
import type * as T from "./Dismissible.types";
import s from "./Dismissible.module.css";

const Dismissible = (props: T.Props) => {
  const {
    children,
    onClose,
    hideCloseButton,
    variant,
    closeAriaLabel,
    className,
    attributes,
  } = props;
  const rootClassNames = classNames(
    s.root,
    className,
    variant && s[`--variant-${variant}`],
    hideCloseButton && s["--hide-close"]
  );

  return (
    <div {...attributes} className={rootClassNames}>
      {children}
      {!hideCloseButton && (
        <Button.Aligner className={s.close}>
          <Button
            size="small"
            {...(variant === "media"
              ? { color: "black" }
              : { variant: "ghost" })}
            onClick={onClose}
            attributes={{ "aria-label": closeAriaLabel }}
            startIcon={IconClose}
          />
        </Button.Aligner>
      )}
    </div>
  );
};

export default Dismissible;
