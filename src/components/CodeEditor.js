import AceEditor from "react-ace";

import "ace-builds/src-min-noconflict/theme-cobalt";
import "ace-builds/src-min-noconflict/mode-html";
import "ace-builds/src-min-noconflict/mode-css";
import "ace-builds/src-min-noconflict/mode-javascript";
import "ace-builds/src-min-noconflict/ext-language_tools";

const CodeEditor = (props) => {
  return (
    <AceEditor
      theme="cobalt"
      fontSize={14}
      highlightActiveLine
      enableBasicAutocompletion
      enableLiveAutocompletion
      enableSnippets
      showPrintMargin={false}
      showGutter={false}
      {...props}
    />
  );
};

export default CodeEditor;
