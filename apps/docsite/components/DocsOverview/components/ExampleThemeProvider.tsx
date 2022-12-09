import React from "react";
import { View, ThemeProvider, Button } from "@uicapsule/components";
import Example from "./Example";

const ExampleThemeProvider = () => (
  <Example
    title="Theme provider"
    text="Utility to apply themes and color modes to specific page areas"
    href="/content/docs/utilities/theme-provider"
  >
    <View direction="row" gap={3}>
      <Button color="primary">Share</Button>

      <ThemeProvider theme="twitter">
        <Button color="primary" rounded>
          Share
        </Button>
      </ThemeProvider>
    </View>
  </Example>
);

export default ExampleThemeProvider;
