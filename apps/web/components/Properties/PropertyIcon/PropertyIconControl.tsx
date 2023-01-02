import React from "react";
import { Tabs, Text } from "@uicapsule/components";
import IconZap from "icons/Zap";
import IconHeart from "icons/Heart";
import IconLink from "icons/Link";
import PropertyBaseControl from "../PropertyBase/PropertyBaseControl";
import * as T from "../Properties.types";

const PropertyIconControl = (props: T.IconControlProps) => {
  const { name, value, onChange, hideName } = props;

  return (
    <PropertyBaseControl name={name} hideName={hideName}>
      <Tabs
        variant="pills-elevated"
        itemWidth="equal"
        value={value || ""}
        name={name}
        onChange={({ value, name }) => {
          onChange({ name: name!, value: value?.length ? value : undefined });
        }}
      >
        <Tabs.List>
          <Tabs.Item value="">
            <Text variant="caption-1" color="neutral-faded">
              N/A
            </Text>
          </Tabs.Item>
          <Tabs.Item icon={IconZap} value="IconZap" />
          <Tabs.Item icon={IconHeart} value="IconHeart" />
          <Tabs.Item icon={IconLink} value="IconLink" />
        </Tabs.List>
      </Tabs>
    </PropertyBaseControl>
  );
};

export default PropertyIconControl;
