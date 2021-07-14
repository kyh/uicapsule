import { useState } from "react";
import styled, { css } from "styled-components";
import dynamic from "next/dynamic";
import Dialog from "@material-ui/core/Dialog";
import Box from "@material-ui/core/Box";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Button from "components/Button";
import IFrame from "components/IFrame";
import { PageSpinner } from "components/Spinner";
import { constructSnippet } from "util/playground";

const CodeEditor = dynamic(() => import("./CodeEditor"), {
  loading: () => <PageSpinner />,
  ssr: false,
});

const DialogTitleContainer = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #002240;
    color: #fff;
    padding-right: ${theme.spacing(1)}px;
    padding-bottom: ${theme.spacing(0.5)}px;
    .cancel-button {
      color: #fff;
      opacity: 0.7;
      margin-right: ${theme.spacing(1)}px;
    }
  `}
`;

const DialogContent = styled.div`
  ${({ theme }) => css`
    display: flex;
    height: 100%;
    padding: 0 ${theme.spacing(2)}px ${theme.spacing(2)}px;
    background-color: #002240;

    .ace_editor {
      width: 50% !important;
      height: 100% !important;
    }

    iframe {
      width: 100%;
      height: 100%;
      border-radius: 8px;
      background-color: #fff;
    }
  `}
`;

const StyledTabs = styled(Tabs)`
  ${({ theme }) => css`
    .MuiTab-root {
      min-width: auto;
      transition: opacity 0.2s ease;
    }
    .MuiTabs-indicator {
      display: none;
    }
  `}
`;

const UIEditorModal = ({ source, open, onCancel, onSave }) => {
  const [dirtyHtml, setDirtyHtml] = useState(source.html || "");
  const [dirtyCss, setDirtyCss] = useState(source.css || "");
  const [dirtyJs, setDirtyJs] = useState(source.javascript || "");
  const [tab, setTab] = useState(0);

  const handleChangeTab = (_event, newTab) => {
    setTab(newTab);
  };

  const saveChanges = () => {
    onSave({
      html: dirtyHtml,
      css: dirtyCss,
      javascript: dirtyJs,
    });
  };

  const editorConfigMap = {
    0: { mode: "html", value: dirtyHtml, onChange: (v) => setDirtyHtml(v) },
    1: { mode: "css", value: dirtyCss, onChange: (v) => setDirtyCss(v) },
    2: { mode: "javascript", value: dirtyJs, onChange: (v) => setDirtyJs(v) },
  };

  const editorConfig = editorConfigMap[tab];

  return (
    <Dialog fullScreen open={open} PaperProps={{ elevation: 0 }}>
      <DialogTitleContainer>
        <StyledTabs value={tab} onChange={handleChangeTab}>
          <Tab label="HTML" disableRipple />
          <Tab label="CSS" disableRipple />
          <Tab label="JS" disableRipple />
        </StyledTabs>
        <Box display="flex" mr={1}>
          <Button className="cancel-button" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            autoFocus
            variant="contained"
            color="primary"
            onClick={saveChanges}
          >
            Save Changes
          </Button>
        </Box>
      </DialogTitleContainer>
      <DialogContent>
        <CodeEditor {...editorConfig} />
        <Box width="50%" height="100%" ml={2}>
          <IFrame
            srcDoc={constructSnippet({
              html: dirtyHtml,
              css: dirtyCss,
              javascript: dirtyJs,
            })}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default UIEditorModal;
