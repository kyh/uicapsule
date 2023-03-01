import React from "react";
import View from "components/View";
import type * as T from "./AspectRatio.types";

const AspectRatio = (props: T.Props) => {
  const { children, ratio = 1, className, attributes } = props;

  return (
    <View aspectRatio={ratio} className={className} attributes={attributes}>
      {children}
    </View>
  );
};

export default AspectRatio;
