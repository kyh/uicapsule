import React, { useRef, useEffect, useState } from "react";
import styled, { css } from "styled-components";
import { useRouter } from "next/router";
import Snackbar from "@material-ui/core/Snackbar";
import { isMobile } from "util/utils";

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
  pointer-events: none;
  &:before {
    pointer-events: none;
    content: "";
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    position: absolute;
    background-color: #00000060;
    z-index: 3;
    transition: background-color 0.2s ease;
  }
  [data-ui-capsule] {
    z-index: 5 !important;
  }
  ${({ isActivated }) =>
    isActivated &&
    css`
      pointer-events: auto;
      &:before {
        background-color: transparent;
      }
    `}
`;

const TryButton = styled.button`
  ${({ theme }) => css`
    font-size: 0.9375rem;
    position: relative;
    top: -${theme.spacing(3)}px;
    background: ${theme.palette.background.default};
    padding: ${theme.spacing(2)}px ${theme.spacing(4)}px;
    box-shadow: ${theme.shadows[4]};
    border-radius: 30px;
    border: none;
    cursor: pointer;
    transition: color 0.2s ease;
    z-index: 5;
    &:hover {
      color: ${theme.palette.primary.main};
    }
  `}
`;

let Extension = null;

const ExtensionPreview = ({ onSetHtml = () => {} }) => {
  const router = useRouter();
  const [isActivated, setIsActivated] = useState(false);
  const [alert, setAlert] = useState({ message: "", open: false });
  const [html, setHtml] = useState("");
  const mountEl = useRef(null);

  const loadAndInitExtension = async () => {
    if (isMobile()) {
      setAlert({
        message: "Unfortunately, this demo doesn't work on mobile",
        open: true,
      });
      return;
    }
    if (!Extension) {
      Extension = await import("@ui-capsule/chrome-extension");
      Extension.mount(mountEl.current, {
        onActivated: () => setIsActivated(true),
        onDeactivated: () => setIsActivated(false),
        onClickViewCapsule: ({ html, image }) => {
          onSetHtml(html);
          router.push("/#features");
        },
      });
    }
    if (!isActivated) {
      Extension.activate();
    } else {
      Extension.deactivate();
    }
  };

  useEffect(() => {
    fetch("/hero-preview.html")
      .then((response) => response.text())
      .then((data) => setHtml(data));

    return () => {
      if (Extension) {
        Extension.deactivate();
        Extension.unmount();
        Extension = null;
      }
    };
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
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={alert.open}
        onClose={() => setAlert({ ...alert, open: false })}
        message={alert.message}
      />
    </PreviewContainer>
  );
};

export default ExtensionPreview;
