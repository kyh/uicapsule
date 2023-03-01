import React from "react";
import View, { ViewProps, ViewItemProps } from "components/View";

export type StackProps = ViewProps;
export type StackItemProps = ViewItemProps & {
  gap?: ViewItemProps["gapBefore"];
};

const Stack = (props: StackProps) => {
  return <View gap={3} {...props} />;
};

const StackItem = (props: StackItemProps) => {
  return <View.Item gapBefore={props.gapBefore || props.gap} {...props} />;
};

Stack.Item = StackItem;
export default Stack;
