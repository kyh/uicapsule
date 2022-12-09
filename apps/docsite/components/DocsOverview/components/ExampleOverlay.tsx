import React from "react";
import { View, Overlay, Text, Image } from "@uicapsule/components";
import Example from "./Example";

const ExampleOverlay = () => (
  <Example
    title="Overlay"
    text="Dark semi-transparent layer to direct user attention to its content"
    href="/content/docs/components/overlay"
  >
    <View width="200px" maxWidth="100%" overflow="hidden" borderRadius="medium">
      <Overlay
        backgroundSlot={<Image src="/img/examples/office.webp" />}
        position="bottom"
      >
        <Text variant="body-medium-2">Office spaces</Text>
      </Overlay>
    </View>
  </Example>
);

export default ExampleOverlay;
