import { ThemeProvider, View, Icon } from "@uicapsule/components";
import IconBell from "icons/Bell";
import Example from "./Example";

const ExampleToast = () => (
  <Example
    title="Toast"
    text="Notification message or a piece of information displayed above the page content"
    href="/content/docs/components/toast"
  >
    <ThemeProvider colorMode="inverted">
      <View
        width="200px"
        padding={4}
        backgroundColor="neutral"
        borderRadius="medium"
        direction="row"
        gap={3}
        align="center"
      >
        <Icon svg={IconBell} size={5} />
        <View.Item grow>Event completed</View.Item>
      </View>
    </ThemeProvider>
  </Example>
);

export default ExampleToast;
