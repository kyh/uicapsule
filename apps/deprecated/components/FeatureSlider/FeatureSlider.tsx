import React from "react";
import { Text, Icon, View } from "@uicapsule/components";
import * as T from "./FeatureSlider.types";
import s from "./FeatureSlider.module.css";

const FeatureItem = (props: T.ItemProps) => (
  <div className={s.item}>
    <View
      padding={5}
      borderRadius="medium"
      backgroundColor="base"
      width="200px"
      gap={2}
      align="center"
      justify="center"
    >
      <Icon
        svg={props.icon}
        size={6}
        attributes={{ style: { color: props.iconColor } }}
      />
      <Text variant="body-medium-2">{props.title}</Text>
    </View>
  </div>
);

const FeatureSlider = (props: T.Props) => {
  const { items, reversed } = props;
  const rootClassNames = s.root + (reversed ? ` ${s["--reversed"]}` : "");

  return (
    <div className={rootClassNames}>
      {[...items, ...items].map((item, index) => (
        <FeatureItem {...item} key={index} />
      ))}
    </div>
  );
};

export default FeatureSlider;
