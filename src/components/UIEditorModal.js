import React, { useState } from "react";
import styled, { css } from "styled-components";
import dynamic from "next/dynamic";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import Box from "@material-ui/core/Box";
import Button from "components/Button";
import Spinner from "components/Spinner";

const Editor = dynamic(
  async () => {
    const ace = await import("react-ace");
    require("ace-builds/src-min-noconflict/theme-monokai");
    require("ace-builds/src-min-noconflict/mode-html");
    require("ace-builds/src-min-noconflict/snippets/html");
    require("ace-builds/src-min-noconflict/ext-language_tools");
    return ace;
  },
  {
    loading: () => <Spinner />,
    ssr: false,
  }
);

const DialogTitleContainer = styled.div`
  ${({ theme }) => css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: ${theme.palette.grey[100]};
  `}
`;

const DialogContent = styled.div`
  display: flex;
  height: 100%;

  iframe,
  .ace_editor {
    width: 50% !important;
    height: 100% !important;
  }
`;

const UIEditorModal = ({ html, open, onCancel, onSave }) => {
  const [code, setCode] = useState(html);
  return (
    <Dialog fullScreen open={open} PaperProps={{ elevation: 0 }}>
      <DialogTitleContainer>
        <DialogTitle>Editor</DialogTitle>
        <Box display="flex" mr={1}>
          <Box mr={1}>
            <Button onClick={onCancel}>Cancel</Button>
          </Box>
          <Button
            autoFocus
            variant="contained"
            color="primary"
            onClick={() => onSave(code)}
          >
            Save
          </Button>
        </Box>
      </DialogTitleContainer>
      <DialogContent>
        <Editor
          placeholder="<div>Hello world</div>"
          mode="html"
          theme="monokai"
          fontSize={14}
          showPrintMargin
          showGutter
          highlightActiveLine
          enableBasicAutocompletion
          enableLiveAutocompletion
          enableSnippets
          onChange={(code) => setCode(code)}
          value={code}
        />
        <iframe srcDoc={code} frameBorder="0" />
      </DialogContent>
    </Dialog>
  );
};

export default UIEditorModal;
