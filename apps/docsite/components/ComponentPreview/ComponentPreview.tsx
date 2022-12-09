import React from "react";
import { Text } from "@uicapsule/components";
import * as T from "./ComponentPreview.types";
import s from "./ComponentPreview.module.css";

const ComponentPreview = (props: T.Props) => {
  const {
    children,
    height,
    centered,
    elevated,
    bordered,
    interactive = true,
  } = props;

  return (
    <Text
      variant="body-2"
      className={[
        s.root,
        centered && s["--centered"],
        elevated && s["--elevated"],
        !interactive && s["--non-interactive"],
        bordered && s["--borderd"],
      ]}
      attributes={{ style: { minHeight: height } }}
    >
      <div className={s.inner}>{children}</div>
    </Text>
  );
};

export default ComponentPreview;
