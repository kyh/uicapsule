"use client";

import {
  FileTabs,
  SandpackFileExplorer,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useActiveCode,
  useSandpack,
} from "@codesandbox/sandpack-react/unstyled";
import MonacoEditor from "@monaco-editor/react";
import { useTheme } from "@repo/ui/theme";

import type { ContentComponent } from "@/lib/content";

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

const ContentProvider = ({
  contentComponent,
  children,
}: {
  contentComponent: ContentComponent;
  children: React.ReactNode;
}) => {
  return (
    <SandpackProvider
      template="react-ts"
      customSetup={{ dependencies: contentComponent.dependencies }}
      options={{
        externalResources: [
          "https://zmdrwswxugswzmcokvff.supabase.co/storage/v1/object/public/uicapsule/tailwind.js",
        ],
      }}
      files={{
        "/App.tsx": contentComponent.previewCode,
        "/styles.css": defaultPreviewStyles,
        ...contentComponent.sourceCode,
      }}
    >
      {children}
    </SandpackProvider>
  );
};

const defaultPreviewStyles = `
@custom-variant dark (&:is(.dark *));
 
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}
 
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.269 0 0);
  --sidebar-ring: oklch(0.439 0 0);
}
 
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}
 
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
`;

export {
  SandpackLayout,
  SandpackPreview,
  SandpackFileExplorer,
  useSandpack,
  ContentProvider,
  CodeEditor,
};
