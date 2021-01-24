import React, { useRef, useEffect, useState } from "react";
import styled, { css } from "styled-components";

const PreviewContainer = styled.section`
  margin: 0 auto;
  max-width: 1000px;
`;

const PreviewMonitor = styled.div`
  background: url("/hero-preview-bg.svg");
  background-size: 100%;
  background-repeat: no-repeat;
  border-radius: 5px;
  padding-top: 8.4%;
  overflow: hidden;
`;

const PreviewWindow = styled.div`
  position: relative;
  max-height: 70vh;
  pointer-events: auto;
  opacity: 1;
  transition: opacity 0.3s ease;
  [data-ui-capsule] {
    z-index: 5 !important;
  }
  ${({ isActivated }) =>
    !isActivated &&
    css`
      opacity: 0.5;
      pointer-events: none;
    `}
`;

const TryButton = styled.button`
  font-size: 0.9375rem;
  position: relative;
  top: -${({ theme }) => theme.spacing(3)}px;
  background: ${({ theme }) => theme.palette.background.default};
  padding: ${({ theme }) => `${theme.spacing(2)}px ${theme.spacing(4)}px`};
  box-shadow: ${({ theme }) => theme.shadows[4]};
  border-radius: 30px;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
  z-index: 5;
  &:hover {
    background: ${({ theme }) => theme.palette.background.default};
  }
`;

function ExtensionPreview() {
  let Extension;
  const [isActivated, setIsActivated] = useState(false);
  const [html, setHtml] = useState("");
  const mountEl = useRef(null);

  const loadAndInitExtension = async () => {
    if (!Extension) {
      Extension = await import("@ui-capsule/chrome-extension");
      Extension.mount(mountEl.current, true);
    }
    if (!isActivated) {
      Extension.activate();
      setIsActivated(true);
    } else {
      Extension.deactivate();
      setIsActivated(false);
    }
  };

  useEffect(() => {
    return () => {
      if (Extension) {
        Extension.deactivate();
        Extension.unmount();
      }
    };
  }, []);

  useEffect(() => {
    fetch("/hero-preview.html")
      .then((response) => response.text())
      .then((data) => setHtml(data));
  }, []);

  return (
    <PreviewContainer>
      <PreviewMonitor>
        <PreviewWindow isActivated={isActivated}>
          <div ref={mountEl} dangerouslySetInnerHTML={{ __html: html }} />
        </PreviewWindow>
      </PreviewMonitor>
      <TryButton onClick={loadAndInitExtension} isActivated={isActivated}>
        {isActivated
          ? "Mouse over elements above and click to save"
          : "Try it yourself"}
      </TryButton>
    </PreviewContainer>
  );
}

export default ExtensionPreview;
