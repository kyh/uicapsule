import { View, FormControl, TextArea } from "@uicapsule/components";
import Example from "./Example";

const ExampleTextArea = () => (
  <Example
    title="Text area"
    text="Form field to enter and edit multiline text"
    href="/content/docs/components/text-area"
  >
    <View width="180px" maxWidth="100%">
      <FormControl>
        <FormControl.Label>Your review</FormControl.Label>
        <TextArea name="preview" placeholder="What was it like?" />
      </FormControl>
    </View>
  </Example>
);

export default ExampleTextArea;
