import React from "react";
import { ActionBar, View, Button, Text } from "@uicapsule/components";
import IconCart from "icons/Cart";
import Example from "./Example";

const ExampleActionBar = () => (
  <Example
    title="Action bar"
    text="Contextual information and actions related to a specific area on the page"
    href="/content/docs/components/action-bar"
  >
    <View width="300px" maxWidth="100%">
      <ActionBar>
        <View direction="row" align="center">
          <View.Item grow>
            <Text variant="body-medium-2">$10.99</Text>
          </View.Item>
          <Button color="primary" endIcon={IconCart}>
            Add
          </Button>
        </View>
      </ActionBar>
    </View>
  </Example>
);

export default ExampleActionBar;
