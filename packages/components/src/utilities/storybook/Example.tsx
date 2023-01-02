import React from "react";
import View from "components/View";
import Text from "components/Text";
import s from "./Example.module.css";

type Props = {
  title?: string | string[];
  children?: React.ReactNode;
};

const Example = (props: {
  children: React.ReactNode;
  title?: React.ReactNode;
}) => {
  return (
    <View
      gap={3}
      attributes={props.title ? { style: { marginTop: -17 } } : undefined}
    >
      {props.title && (
        <View
          bleed={4}
          padding={[3, 4]}
          backgroundColor="neutral-faded"
          borderColor="neutral-faded"
          attributes={{ style: { position: "sticky", top: 0, zIndex: 100 } }}
        >
          {props.title}
        </View>
      )}
      {props.children}
    </View>
  );
};

const ExampleItem = (props: Props) => {
  const { children } = props;
  const title = typeof props.title === "string" ? [props.title] : props.title;

  return (
    <View borderColor="neutral-faded" borderRadius="medium" overflow="hidden">
      <View padding={[3, 4]} backgroundColor="neutral-faded">
        {title &&
          title.map((line, index) => (
            <Text
              variant="body-2"
              color={index > 0 ? "neutral-faded" : "neutral"}
              key={index}
            >
              {line}
            </Text>
          ))}
      </View>
      <View padding={4} className={s.root}>
        {children}
      </View>
    </View>
  );
};

Example.Item = ExampleItem;
export default Example;
