import { Dismissible, Placeholder } from "@uicapsule/components";
import Example from "./Example";

const ExampleDismissible = () => (
  <Example
    title="Dismissible"
    text="Utility for displaying different types of content that can be removed from the screen"
    href="/content/docs/utilities/dismissible"
  >
    <Dismissible closeAriaLabel="Close banner">
      <Placeholder w={150}>Content</Placeholder>
    </Dismissible>
  </Example>
);

export default ExampleDismissible;
