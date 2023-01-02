import { Accordion, View } from "@uicapsule/components";
import Example from "./Example";

const ExampleAccordion = () => (
  <Example
    title="Accordion"
    text="Utility to toggle visibily of content regions"
    href="/content/docs/utilities/accordion"
  >
    <Accordion active>
      <Accordion.Trigger>
        <View
          backgroundColor="neutral"
          height="20px"
          width="200px"
          borderRadius="small"
        />
      </Accordion.Trigger>
      <Accordion.Content>
        <View paddingTop={2}>
          <View backgroundColor="neutral" height="40px" borderRadius="small" />
        </View>
      </Accordion.Content>
    </Accordion>
  </Example>
);

export default ExampleAccordion;
