import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Copy, Ellipsis, Search } from "lucide-react";

import { Badge, Kbd } from "../components/badge";
import { Button } from "../components/button";
import { TextField } from "../components/field";
import { Icon } from "../components/icon";
import { Dialog, Menu, Popover, Tooltip } from "../components/overlays";
import { useToast } from "../components/toast";
import { Category, Specimen } from "./specimen";

export const OVERLAY_NAMES = ["Dialog", "Popover", "Tooltip", "Menu", "Command palette"] as const;

interface Command {
  label: string;
  group: string;
  hint: string;
}

const COMMANDS: Command[] = [
  { group: "Runs", hint: "kr-2817-3", label: "Jump to the run held at merge" },
  { group: "Runs", hint: "agent/pin-undici", label: "Rebase a branch that fell behind" },
  { group: "Agents", hint: "warden", label: "Take an agent out of its slot" },
  { group: "Agents", hint: "tern-4", label: "Propose a model swap" },
  { group: "Keys", hint: "kd_prod_", label: "Mint a deploy key" },
  { group: "Repos", hint: "storefront", label: "Assign an issue to the line" },
];

const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDialogElement>(null);
  const toast = useToast();

  const results = COMMANDS.filter((command) =>
    `${command.label} ${command.hint}`.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    const dialog = ref.current;

    if (!dialog) {
      return;
    }

    dialog.setAttribute("closedby", "any");

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const run = (command: Command | undefined) => {
    if (!command) {
      return;
    }

    setOpen(false);
    setQuery("");
    setActive(0);
    toast({ description: command.hint, title: command.label });
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(results.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      run(results[active]);
    }
  };

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
        size="sm"
      >
        <Icon icon={Search} />
        Search commands
        <Kbd>⌘K</Kbd>
      </Button>
      <dialog
        aria-label="Command palette"
        className="fj-command"
        onClose={() => {
          setOpen(false);
        }}
        ref={ref}
      >
        {open ? (
          <>
            <div className="fj-command-input">
              <Icon icon={Search} />
              <input
                aria-activedescendant={results.length > 0 ? `fj-cmd-${active}` : undefined}
                aria-autocomplete="list"
                aria-controls="fj-cmd-list"
                aria-expanded
                aria-label="Search commands"
                autoFocus
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Type a command or a run id"
                role="combobox"
                value={query}
              />
            </div>
            {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- a combobox popup of commands has no native element; select cannot hold a live-filtered list */}
            <div className="fj-command-list fj-menu" id="fj-cmd-list" role="listbox">
              {results.length === 0 ? (
                <p className="fj-empty-text fj-command-empty">No command matches {query}.</p>
              ) : (
                results.map((command, index) => (
                  <div
                    aria-selected={index === active}
                    className="fj-menu-item"
                    data-active={index === active ? "" : undefined}
                    id={`fj-cmd-${index}`}
                    key={command.label}
                    onPointerUp={() => {
                      run(command);
                    }}
                    onPointerMove={() => {
                      setActive(index);
                    }}
                    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- option elements only live inside select or datalist
                    role="option"
                    tabIndex={-1}
                  >
                    {command.label}
                    <span className="fj-menu-meta">{command.hint}</span>
                  </div>
                ))
              )}
            </div>
            <div className="fj-command-foot">
              <span className="fj-hstack" data-gap="4">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> move
              </span>
              <span className="fj-hstack" data-gap="4">
                <Kbd>↵</Kbd> run
              </span>
              <span className="fj-hstack" data-gap="4">
                <Kbd>esc</Kbd> close
              </span>
            </div>
          </>
        ) : null}
      </dialog>
    </>
  );
};

export const Overlays = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("patchwright");
  const toast = useToast();

  return (
    <Category
      id="overlays"
      lede="The only things in Fjord that cast a shadow. Each is solid paper edged by the frame line, and each opens at full size."
      title="Overlays"
    >
      <Specimen
        description="One paper sheet: the question and its field, then a ruled strip of actions. The page behind dims and stops taking clicks."
        name="Dialog"
      >
        <Button
          onClick={() => {
            setOpen(true);
          }}
        >
          Rename agent
        </Button>
        <Dialog
          description="Runs already in flight keep the old name in their traces."
          footer={
            <>
              <Button
                onClick={() => {
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setOpen(false);
                  toast({ title: `Renamed to ${name}` });
                }}
                variant="primary"
              >
                Rename agent
              </Button>
            </>
          }
          onOpenChange={setOpen}
          open={open}
          title="Rename patchwright"
        >
          <TextField
            label="Name"
            mono
            onChange={(event) => {
              setName(event.target.value);
            }}
            value={name}
          />
        </Dialog>
      </Specimen>
      <Specimen
        description="Detail next to the thing it explains, without blocking the page. It closes on Escape or on any click outside it."
        name="Popover"
      >
        <Popover
          label="Model details"
          renderTrigger={({ open: isOpen, toggle, id }) => (
            <Button
              aria-controls={isOpen ? id : undefined}
              aria-expanded={isOpen}
              onClick={toggle}
              size="sm"
            >
              tern-3
            </Button>
          )}
        >
          <div className="fj-popover-body">
            <span className="fj-hstack">
              <span className="fj-t-label">tern-3</span>
              <Badge>Model</Badge>
            </span>
            <p className="fj-t-body-sm fj-c-2">
              patchwright and scribe run on it. This run read 9,184 tokens for $0.034.
            </p>
          </div>
        </Popover>
      </Specimen>
      <Specimen
        description="Puts a name to a button that is only an icon: after 400ms of hover, or straight away on focus."
        name="Tooltip"
      >
        <div className="fj-hstack fj-tooltip-stage">
          <Tooltip align="start" content="Copy run id">
            {(props) => (
              <Button aria-label="Copy run id" size="icon-sm" variant="ghost" {...props}>
                <Icon icon={Copy} />
              </Button>
            )}
          </Tooltip>
          <span className="fj-t-body-sm fj-c-2">Hover or tab to the button.</span>
        </div>
      </Specimen>
      <Specimen
        description="What you can do to one run, in words. O and C pick their items while the menu is open, and Cancel run is set in the fail text."
        name="Menu"
      >
        <Menu
          items={[
            {
              label: "Open trace",
              onSelect: () => toast({ title: "Opened kr-2817-3" }),
              shortcut: "O",
            },
            { label: "Rerun on tern-4", onSelect: () => toast({ title: "Rerun joined the line" }) },
            {
              label: "Copy run id",
              onSelect: () => toast({ title: "Copied kr-2817-3" }),
              shortcut: "C",
            },
            {
              destructive: true,
              label: "Cancel run",
              onSelect: () => toast({ status: "warn", title: "Run cancelled" }),
            },
          ]}
          label="Run actions"
          renderTrigger={({ open: isOpen, toggle, id }) => (
            <Button
              aria-controls={isOpen ? id : undefined}
              aria-expanded={isOpen}
              aria-haspopup="menu"
              onClick={toggle}
              size="sm"
            >
              <Icon icon={Ellipsis} />
              Run actions
            </Button>
          )}
        />
      </Specimen>
      <Specimen
        description="Any action by name, from anywhere on the page with ⌘K. Type part of a run id or a branch to narrow it."
        name="Command palette"
      >
        <CommandPalette />
      </Specimen>
    </Category>
  );
};
