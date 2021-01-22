import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import Button from "@material-ui/core/Button";

const Container = styled.div`
  background: #333;
  width: 100%;
  height: 100%;
  border-radius: 5px;
  overflow: hidden;
`;

function ExtensionPreview() {
  let Extension;
  const containerEl = useRef(null);

  const loadAndInitExtension = async () => {
    Extension = await import("@ui-capsule/chrome-extension/dist/module");
    Extension.mount(containerEl.current, true);
    Extension.activate();
  };

  useEffect(() => {
    return () => {
      if (Extension) {
        Extension.deactivate();
        Extension.unmount();
      }
    };
  }, []);

  return (
    <Container ref={containerEl}>
      Hello world
      <Button
        type="button"
        variant="contained"
        color="secondary"
        size="large"
        onClick={loadAndInitExtension}
      >
        Try it
      </Button>
    </Container>
  );
}

export default ExtensionPreview;
