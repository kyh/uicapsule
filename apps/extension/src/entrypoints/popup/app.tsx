import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Logo } from "@repo/ui/components/logo";
import { ArrowUpRight, Camera, ChevronRight, Crop, Keyboard, Settings } from "lucide-react";

import { runResultSchema } from "@/lib/messages";
import type { Tool } from "@/lib/messages";

const COMMANDS = [
  { command: "capture-region", icon: <Crop />, label: "Capture region", tool: "region" },
  { command: "capture-visible", icon: <Camera />, label: "Capture visible area", tool: "visible" },
] satisfies { command: string; icon: ReactNode; label: string; tool: Tool }[];

const capturable = (url: string | undefined) => url !== undefined && /^https?:\/\//iu.test(url);

const Row = ({
  children,
  disabled,
  icon,
  onClick,
  trailing,
}: {
  children: ReactNode;
  disabled?: boolean;
  icon: ReactNode;
  onClick: () => void;
  trailing?: ReactNode;
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0"
  >
    <span className="text-muted-foreground">{icon}</span>
    <span className="min-w-0 flex-1 truncate">{children}</span>
    {trailing}
  </button>
);

const Keys = ({ shortcut }: { shortcut: string }) => (
  <span className="flex gap-0.5">
    {shortcut.split("+").map((key) => (
      <kbd
        key={key}
        className="grid h-5 min-w-5 place-items-center rounded-md border border-border px-1 font-sans text-[11px] text-muted-foreground"
      >
        {key.replace("Alt", "⌥").replace("Shift", "⇧")}
      </kbd>
    ))}
  </span>
);

export const App = () => {
  const [tab, setTab] = useState<{ id?: number; url?: string } | null>(null);
  const [shortcuts, setShortcuts] = useState(new Map<string, string>());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [active] = await browser.tabs.query({ active: true, currentWindow: true });
      const commands = await browser.commands.getAll();
      setTab({ id: active?.id, url: active?.url });
      setShortcuts(
        new Map(
          commands.flatMap(({ name, shortcut }) => (name && shortcut ? [[name, shortcut]] : [])),
        ),
      );
    };

    void load();
  }, []);

  const tabId = tab && capturable(tab.url) ? tab.id : undefined;

  const run = async (tool: Tool) => {
    if (tabId === undefined) {
      return;
    }

    const result = runResultSchema.parse(
      await browser.runtime.sendMessage({ tabId, tool, type: "run" }),
    );

    if (result.ok) {
      window.close();
    } else {
      setError(result.reason);
    }
  };

  return (
    <main className="rise flex flex-col">
      <header className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <Logo className="size-5" />
        <h1 className="text-sm font-medium">Request a component</h1>
      </header>

      {tab && tabId === undefined ? (
        <output className="block px-4 pb-2 text-xs text-muted-foreground">
          UICapsule can&apos;t capture this page. Open a regular web page to request from it.
        </output>
      ) : null}

      {error ? (
        <p key={error} role="alert" className="shake px-4 pb-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <nav aria-label="Capture" className="flex flex-col p-1.5">
        {COMMANDS.map(({ command, icon, label, tool }) => {
          const shortcut = shortcuts.get(command);

          return (
            <Row
              key={tool}
              disabled={tabId === undefined}
              icon={icon}
              onClick={() => {
                void run(tool);
              }}
              trailing={shortcut ? <Keys shortcut={shortcut} /> : null}
            >
              {label}
            </Row>
          );
        })}
      </nav>

      <nav aria-label="More" className="flex flex-col border-t border-border p-1.5">
        <Row
          icon={<Keyboard />}
          onClick={() => {
            void browser.tabs.create({ url: "chrome://extensions/shortcuts" });
          }}
          trailing={<ChevronRight className="text-muted-foreground" />}
        >
          Shortcuts
        </Row>
        <Row
          icon={<Settings />}
          onClick={() => {
            void browser.runtime.openOptionsPage();
          }}
          trailing={<ArrowUpRight className="text-muted-foreground" />}
        >
          Settings
        </Row>
      </nav>
    </main>
  );
};
