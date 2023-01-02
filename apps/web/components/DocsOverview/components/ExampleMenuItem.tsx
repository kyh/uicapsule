import { MenuItem, View } from "@uicapsule/components";
import Example from "./Example";

const ExampleMenuItem = () => (
  <Example
    title="Menu item"
    text="Interactive element to show choices or actions in the menu"
    href="/content/docs/components/menu-item"
  >
    <View width="240px" maxWidth="100%" gap={1}>
      <MenuItem selected endSlot="FR" roundedCorners>
        French
      </MenuItem>
      <MenuItem endSlot="NL" roundedCorners>
        Dutch
      </MenuItem>
    </View>
  </Example>
);

export default ExampleMenuItem;
