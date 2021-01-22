import React, { useRef, useEffect } from "react";
import styled from "styled-components";
import Button from "@material-ui/core/Button";
import init, {
  deactivate,
  activate,
} from "@ui-capsule/chrome-extension/dist/module";

const Container = styled.div`
  background: #333;
  width: 100%;
  height: 100%;
  border-radius: 5px;
  overflow: hidden;
`;

function ExtensionPreview() {
  const containerEl = useRef(null);
  useEffect(() => {
    if (containerEl) {
      init(containerEl.current);
    }
    return () => {
      deactivate();
    };
  }, [containerEl]);

  return (
    <Container ref={container}>
      Hello
      <Button
        type="button"
        variant="contained"
        color="secondary"
        size="large"
        onClick={activate}
      >
        Try it
      </Button>
    </Container>
  );
}

export default ExtensionPreview;
