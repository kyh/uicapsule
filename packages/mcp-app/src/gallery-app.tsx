import { useEffect, useState } from "react";
import { useApp, useDocumentTheme, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps/react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Spinner } from "@repo/ui/components/spinner";
import { Maximize2Icon } from "lucide-react";

import { ComponentDetail } from "./component-detail";
import { GalleryGrid } from "./gallery-grid";
import { searchArgumentsSchema } from "./gallery-schema";
import { toResults } from "./tool-result";

import type { GalleryEntry } from "./gallery-schema";
import type { Results } from "./tool-result";

const SEARCH_LIMIT = 24;

type View = { kind: "grid" } | { kind: "detail"; entry: GalleryEntry };

const useDarkClass = () => {
  const theme = useDocumentTheme();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
};

const handoffPrompt = (entry: GalleryEntry) =>
  `Add the ${entry.name} component from UICapsule to this project: call get_component with slug "${entry.slug}" for its files and dependencies, then install it.`;

const ResultsBody = ({
  onOpen,
  results,
}: {
  onOpen: (entry: GalleryEntry) => void;
  results: Results;
}) => {
  if (results.status === "loading") {
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (results.status === "error") {
    return <p className="text-destructive p-4 text-sm">{results.message}</p>;
  }

  if (results.components.length === 0) {
    return <p className="text-muted-foreground p-4 text-sm">No components match that search.</p>;
  }

  return <GalleryGrid components={results.components} onOpen={onOpen} />;
};

interface GalleryProps {
  app: App;
  context: McpUiHostContext | undefined;
  initialQuery: string;
  results: Results;
  setResults: (results: Results) => void;
}

const Gallery = ({ app, context, initialQuery, results, setResults }: GalleryProps) => {
  const [query, setQuery] = useState(initialQuery);
  const [view, setView] = useState<View>({ kind: "grid" });

  const search = async (text: string) => {
    setView({ kind: "grid" });
    setResults({ status: "loading" });

    try {
      const result = await app.callServerTool({
        arguments: { limit: SEARCH_LIMIT, query: text },
        name: "search_components",
      });

      setResults(toResults(result));
    } catch (error) {
      setResults({
        message: error instanceof Error ? error.message : String(error),
        status: "error",
      });
    }
  };

  const openLink = (url: string) => {
    void app.openLink({ url });
  };

  const handOff = async (entry: GalleryEntry) => {
    try {
      const { isError } = await app.sendMessage({
        content: [{ text: handoffPrompt(entry), type: "text" }],
        role: "user",
      });

      return isError !== true;
    } catch {
      return false;
    }
  };

  const insets = context?.safeAreaInsets;

  const canExpand =
    context?.displayMode !== "fullscreen" &&
    (context?.availableDisplayModes?.includes("fullscreen") ?? false);

  return (
    <main
      style={{
        paddingBottom: insets?.bottom,
        paddingLeft: insets?.left,
        paddingRight: insets?.right,
        paddingTop: insets?.top,
      }}
    >
      {view.kind === "detail" ? (
        <ComponentDetail
          entry={view.entry}
          onBack={() => {
            setView({ kind: "grid" });
          }}
          onOpenLink={openLink}
          onUse={handOff}
        />
      ) : (
        <>
          <form
            className="flex h-12 items-center gap-2 border-b bg-(image:--background-stripe) bg-size-[10px_10px] px-2"
            onSubmit={(event) => {
              event.preventDefault();
              void search(query);
            }}
          >
            <Input
              aria-label="Search components"
              className="bg-background dark:bg-background h-8 flex-1"
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              placeholder="Search UICapsule — a dial, a slider, a shutter…"
              type="search"
              value={query}
            />
            {canExpand && (
              <Button
                aria-label="Expand the gallery"
                onClick={() => {
                  void app.requestDisplayMode({ mode: "fullscreen" });
                }}
                size="icon-sm"
                variant="ghost"
              >
                <Maximize2Icon />
              </Button>
            )}
          </form>
          <ResultsBody
            onOpen={(entry) => {
              setView({ entry, kind: "detail" });
            }}
            results={results}
          />
        </>
      )}
    </main>
  );
};

/** The `search_components` view: connects to the host, then renders the gallery it was handed. */
export const GalleryApp = () => {
  const [results, setResults] = useState<Results>({ status: "loading" });
  const [initialQuery, setInitialQuery] = useState("");
  const [context, setContext] = useState<McpUiHostContext | undefined>();

  const { app, error } = useApp({
    appInfo: { name: "uicapsule-gallery", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (created) => {
      created.addEventListener("toolinput", ({ arguments: input }) => {
        setInitialQuery(searchArgumentsSchema.safeParse(input).data?.query ?? "");
      });
      created.addEventListener("toolresult", (result) => {
        setResults(toResults(result));
      });
      created.addEventListener("toolcancelled", () => {
        setResults({ message: "The search was cancelled.", status: "error" });
      });
      created.addEventListener("hostcontextchanged", (changed) => {
        setContext((previous) => ({ ...(previous ?? created.getHostContext()), ...changed }));
      });
    },
  });

  const hostContext = context ?? app?.getHostContext();
  useHostStyles(app, hostContext);
  useDarkClass();

  if (error !== null) {
    return <p className="text-destructive p-4 text-sm">{error.message}</p>;
  }

  if (app === null) {
    return (
      <div className="text-muted-foreground flex h-48 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <Gallery
      key={initialQuery}
      app={app}
      context={hostContext}
      initialQuery={initialQuery}
      results={results}
      setResults={setResults}
    />
  );
};
