import React from "react";
import { View, Badge } from "@uicapsule/components";
import Example from "./Example";

const ExampleBadge = () => (
  <Example
    title="Badge"
    text="Compact element that represents the status of an object or user input"
    href="/content/docs/components/badge"
  >
    <View direction="row" align="center" gap={3}>
      <Badge color="primary" variant="faded">
        NEW
      </Badge>
      <Badge color="critical" rounded size="small">
        23
      </Badge>
    </View>
  </Example>
);

export default ExampleBadge;
