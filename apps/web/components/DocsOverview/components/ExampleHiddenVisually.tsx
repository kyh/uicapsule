import { HiddenVisually } from "@uicapsule/components";
import Example from "./Example";

const ExampleHiddenVisually = () => (
  <Example
    title="Hidden visually"
    text="Utility that provides the content to assistive technologies while hiding it from the screen"
    href="/content/docs/utilities/hidden-visually"
  >
    <HiddenVisually>
      This content is only available to screen readers
    </HiddenVisually>
  </Example>
);

export default ExampleHiddenVisually;
