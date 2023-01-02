import {
  Popover,
  Text,
  Avatar,
  View,
  Dismissible,
  Button,
} from "@uicapsule/components";
import Example from "./Example";

const ExamplePopover = () => (
  <Example
    title="Popover"
    text="Container displaying rich content on top of other content triggered by an interactive element"
    href="/content/docs/components/popover"
  >
    <div style={{ marginTop: -50 }}>
      <Popover active position="bottom" forcePosition triggerType="hover">
        <Popover.Trigger>
          {(attributes) => (
            <Button attributes={attributes} size="small">
              Show location
            </Button>
          )}
        </Popover.Trigger>
        <Popover.Content>
          <Dismissible closeAriaLabel="Close popover">
            <View direction="row" gap={3}>
              <Avatar squared src="/img/examples/fuji.webp" />
              <View.Item>
                <Text variant="body-1">Mt. Fuji</Text>
                <Text>Japan</Text>
              </View.Item>
            </View>
          </Dismissible>
        </Popover.Content>
      </Popover>
    </div>
  </Example>
);

export default ExamplePopover;
