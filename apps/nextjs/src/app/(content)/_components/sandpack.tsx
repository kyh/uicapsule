"use client";

import {
  FileTabs,
  SandpackFileExplorer,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  SandpackStack,
  useActiveCode,
  useSandpack,
} from "@codesandbox/sandpack-react/unstyled";
import MonacoEditor from "@monaco-editor/react";
import { useTheme } from "@repo/ui/theme";

const getLanguage = (file: string) => {
  const language = file.split(".").pop();
  switch (language) {
    case "js":
    case "mjs":
    case "cjs":
    case "javascript":
      return "javascript";
    case "ts":
    case "typescript":
      return "typescript";
    case "tsx":
      return "typescript";
    case "jsx":
      return "javascript";
    case "json":
      return "json";
    case "css":
      return "css";
    case "scss":
      return "scss";
    case "less":
      return "less";
    case "html":
    case "htm":
      return "html";
    case "md":
    case "markdown":
      return "markdown";
    case "xml":
      return "xml";
    case "yaml":
    case "yml":
      return "yaml";
    case "sh":
    case "bash":
      return "shell";
    case "py":
    case "python":
      return "python";
    case "go":
      return "go";
    case "rs":
    case "rust":
      return "rust";
    case "php":
      return "php";
    case "java":
      return "java";
    case "c":
      return "c";
    case "cpp":
    case "c++":
    case "cc":
    case "cxx":
      return "cpp";
    case "cs":
    case "csharp":
      return "csharp";
    case "swift":
      return "swift";
    case "dart":
      return "dart";
    case "sql":
      return "sql";
    case "r":
      return "r";
    case "ruby":
    case "rb":
      return "ruby";
    case "perl":
    case "pl":
      return "perl";
    case "kotlin":
    case "kt":
      return "kotlin";
    case "scala":
      return "scala";
    case "lua":
      return "lua";
    case "dockerfile":
      return "dockerfile";
    case "ini":
      return "ini";
    case "toml":
      return "toml";
    case "makefile":
      return "makefile";
    case "powershell":
    case "ps1":
      return "powershell";
    case "plaintext":
    case "txt":
      return "plaintext";
    default:
      return language ?? "plaintext";
  }
};

function beforeMount(monaco: typeof import("monaco-editor")) {
  // Disable TypeScript diagnostics (squiggles)
  monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  });

  // If you also use JavaScript models, disable those too
  monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  });

  // Optional: reduce TS worker involvement further
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    noLib: true,
    allowNonTsExtensions: true,
  });
}

const CodeEditor = () => {
  const { resolvedTheme } = useTheme();
  const { code, updateCode } = useActiveCode();
  const { sandpack } = useSandpack();
  const language = getLanguage(sandpack.activeFile);

  return (
    <div className="flex w-[calc(100dvw-200px)] flex-col">
      <FileTabs />
      <MonacoEditor
        key={sandpack.activeFile}
        width="100%"
        height="100%"
        language={language}
        theme={resolvedTheme === "dark" ? "vs-dark" : "vs-light"}
        beforeMount={beforeMount}
        defaultValue={code}
        onChange={(value) => updateCode(value ?? "")}
        options={{
          quickSuggestions: false,
        }}
      />
    </div>
  );
};

export {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  useSandpack,
  SandpackFileExplorer,
  CodeEditor,
};
