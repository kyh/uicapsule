import { Tabs } from "@uicapsule/components";
import Example from "./Example";

const ExampleTabs = () => (
  <Example
    title="Tabs"
    text="Navigation between multiple pages or content sections"
    href="/content/docs/components/tabs"
  >
    <Tabs variant="pills-elevated">
      <Tabs.List>
        <Tabs.Item value="0">List view</Tabs.Item>
        <Tabs.Item value="1">Map view</Tabs.Item>
      </Tabs.List>
    </Tabs>
  </Example>
);

export default ExampleTabs;
