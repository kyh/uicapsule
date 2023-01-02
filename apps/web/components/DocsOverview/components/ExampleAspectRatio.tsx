import { AspectRatio, View, Text } from "@uicapsule/components";
import Example from "./Example";

const ExampleAspectRatio = () => (
  <Example
    title="Aspect ratio"
    text="Utility for defining an element's size proportions"
    href="/content/docs/utilities/aspect-ratio"
  >
    <AspectRatio ratio={16 / 9}>
      <View
        backgroundColor="neutral-faded"
        borderRadius="medium"
        width="200px"
        justify="center"
        align="center"
      >
        <Text color="neutral-faded" variant="body-medium-2">
          16:9
        </Text>
      </View>
    </AspectRatio>
  </Example>
);

export default ExampleAspectRatio;
