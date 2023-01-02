import React from "react";
import FlyoutControlled from "./FlyoutControlled";
import type * as T from "./Flyout.types";

const FlyoutUncontrolled = (
  props: T.UncontrolledProps & T.DefaultProps,
  ref: T.Ref
) => {
  const { defaultActive, onClose, onOpen } = props;
  const [active, setActive] = React.useState(defaultActive || false);

  const handleClose = () => {
    setActive(false);
    if (onClose) onClose();
  };

  const handleOpen = () => {
    setActive(true);
    if (onOpen) onOpen();
  };

  return (
    <FlyoutControlled
      {...props}
      ref={ref}
      defaultActive={undefined}
      active={active}
      onClose={handleClose}
      onOpen={handleOpen}
    />
  );
};

export default React.forwardRef(FlyoutUncontrolled);
