import React from "react";
import { Example } from "utilities/storybook";
import Backdrop from "components/Backdrop";
import Button from "components/Button";
import useToggle from "hooks/useToggle";

export default { title: "Utilities/Backdrop" };

export const base = () => {
  const baseToggle = useToggle(true);
  const transparentToggle = useToggle(false);

  return (
    <Example>
      <Example.Item title="locks scroll">
        <Button onClick={() => baseToggle.activate()}>Open backdrop</Button>
        <Backdrop
          active={baseToggle.active}
          onClose={() => baseToggle.deactivate()}
        >
          Backdrop content
        </Backdrop>
        <div style={{ height: 1000 }} />
      </Example.Item>

      <Example.Item title="transparent, doesn't lock scroll">
        <Button onClick={() => transparentToggle.activate()}>
          Open backdrop
        </Button>
        <Backdrop
          active={transparentToggle.active}
          onClose={() => transparentToggle.deactivate()}
          transparent
        >
          Backdrop content
        </Backdrop>
        <div style={{ height: 1000 }} />
      </Example.Item>
    </Example>
  );
};
