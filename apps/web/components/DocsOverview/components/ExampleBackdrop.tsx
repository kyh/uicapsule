import { Text } from "@uicapsule/components";
import Example from "./Example";

const ExampleBackdrop = () => (
  <Example
    title="Backdrop"
    text="Faded-out layer used to emphasize a specific element on the page"
    href="/content/docs/utilities/backdrop"
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0, 0, 0, 0.4)",
        padding: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--uic-color-white)",
      }}
    >
      <Text variant="body-medium-2">Content</Text>
    </div>
  </Example>
);

export default ExampleBackdrop;
