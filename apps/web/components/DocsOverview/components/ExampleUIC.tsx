import { Icon } from "@uicapsule/components";
import IconUIC from "icons/colored/UIC";
import Example from "./Example";

const ExampleUIC = () => (
  <Example
    title="UIC provider"
    text="Global context provider that provides all of our and your components with a shared context"
    href="/content/docs/utilities/@uicapsule/components"
  >
    <Icon size={6} svg={IconUIC} />
  </Example>
);

export default ExampleUIC;
