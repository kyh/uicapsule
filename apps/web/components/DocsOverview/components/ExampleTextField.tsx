import { View, FormControl, TextField } from "@uicapsule/components";
import Example from "./Example";

const ExampleTextField = () => (
  <Example
    title="Text field"
    text="Form field to enter and edit single-line text"
    href="/content/docs/components/text-field"
  >
    <View width="180px" maxWidth="100%">
      <FormControl>
        <FormControl.Label>Your email</FormControl.Label>
        <TextField
          name="preview"
          placeholder="hello@@uicapsule/components.so"
        />
      </FormControl>
    </View>
  </Example>
);

export default ExampleTextField;
