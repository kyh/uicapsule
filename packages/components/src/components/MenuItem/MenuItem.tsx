import React from "react";
import {
  classNames,
  responsiveClassNames,
  responsivePropDependency,
} from "utilities/helpers";
import Actionable, { ActionableRef } from "components/Actionable";
import Icon from "components/Icon";
import View from "components/View";
import MenuItemAligner from "./MenuItemAligner";
import type * as T from "./MenuItem.types";
import s from "./MenuItem.module.css";

const MenuItemBase = (props: T.Props, ref: ActionableRef) => {
  const {
    startIcon,
    startSlot,
    endSlot,
    children,
    selected,
    noHover,
    disabled,
    onClick,
    href,
    size = "medium",
    roundedCorners,
    className,
    attributes,
    icon,
  } = props;
  const rootClassNames = classNames(
    s.root,
    className,
    responsiveClassNames(s, "--size", size),
    responsiveClassNames(s, "--rounded-corners", roundedCorners),
    selected && s["--selected"],
    noHover && s["--no-hover"],
    disabled && s["--disabled"]
  );
  const gapSize = responsivePropDependency(size, (size) => {
    const map = { large: 4, medium: 3, small: 2 };
    return map[size];
  });
  const iconSize = responsivePropDependency(size, (size) =>
    size === "small" ? 4 : 5
  );

  return (
    <Actionable
      disabled={disabled}
      className={rootClassNames}
      attributes={attributes}
      onClick={onClick}
      href={href}
      ref={ref}
    >
      <View direction="row" gap={gapSize} align="center">
        {(startIcon || icon) && (
          <Icon svg={(startIcon || icon)!} className={s.icon} size={iconSize} />
        )}
        {!startIcon && !icon && startSlot}
        {children && <View.Item grow>{children}</View.Item>}
        {endSlot}
      </View>
    </Actionable>
  );
};

const MenuItem = React.forwardRef(MenuItemBase) as T.Export;
MenuItem.Aligner = MenuItemAligner;

export default MenuItem;
