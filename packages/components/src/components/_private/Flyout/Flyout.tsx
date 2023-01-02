import React from "react";
import FlyoutUncontrolled from "./FlyoutUncontrolled";
import FlyoutControlled from "./FlyoutControlled";
import FlyoutTrigger from "./FlyoutTrigger";
import FlyoutContent from "./FlyoutContent";
import type * as T from "./Flyout.types";

const FlyoutBase = (props: T.Props, ref: T.Ref) => {
  const { active } = props;

  if (typeof active === "boolean")
    return (
      <FlyoutControlled
        {...(props as T.ControlledProps & T.DefaultProps)}
        ref={ref}
      />
    );
  return (
    <FlyoutUncontrolled
      {...(props as T.UncontrolledProps & T.DefaultProps)}
      ref={ref}
    />
  );
};

const Flyout = React.forwardRef(FlyoutBase) as T.Compound;
Flyout.Trigger = FlyoutTrigger;
Flyout.Content = FlyoutContent;

export default Flyout;
