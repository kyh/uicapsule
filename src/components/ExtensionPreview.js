import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import Button from "@material-ui/core/Button";

const PreviewContainer = styled.section`
  position: relative;
  margin: 0 auto;
  max-width: 900px;
  height: 470px;
`;

const Preview = styled.div`
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
    if (!Extension) {
      Extension = await import("@ui-capsule/chrome-extension");
      Extension.mount(containerEl.current, true);
    }
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
    <PreviewContainer>
      <Preview ref={containerEl}>Hello world</Preview>
      <Button
        type="button"
        variant="contained"
        color="secondary"
        size="large"
        onClick={loadAndInitExtension}
      >
        Try it
      </Button>
    </PreviewContainer>
  );
}

export default ExtensionPreview;
