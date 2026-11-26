import {
  Ban,
  Copy,
  Database,
  FileText,
  Info,
  Pause,
  Play,
  RotateCcw,
  Workflow,
  HardDrive,
  LayoutList,
} from "lucide-react";
import { useState } from "react";

import { Button } from "../components/button";
import { CommandPalette } from "../components/command";
import type { CommandItem } from "../components/command";
import { Input } from "../components/field";
import { Dialog } from "../components/dialog";
import { Icon } from "../components/icon";
import { MoreGlyph } from "../components/more-glyph";
import { DropdownMenu } from "../components/menu";
import { Group, Sheet, SpecCell } from "../components/page";
import { groupHead } from "./catalog";
import { Popover, Tooltip } from "../components/popover";
import { DataList } from "../components/data-list";
import { Kbd } from "../components/tag";
import { useToast } from "../components/toast";

export const COMMANDS: CommandItem[] = [
  { group: "Screen", icon: LayoutList, id: "s1", label: "Run board", target: "s-runs" },
  { group: "Screen", icon: LayoutList, id: "s2", label: "Schema drift", target: "s-drift" },
  { group: "Screen", icon: LayoutList, id: "s3", label: "Credit spend", target: "s-spend" },
  { group: "Screen", icon: LayoutList, id: "s4", label: "Customer 360 refresh", target: "s-sync" },
  { group: "Pipeline", icon: Workflow, id: "p1", label: "ledger.entries_daily", target: "s-runs" },
  {
    group: "Pipeline",
    icon: Workflow,
    id: "p2",
    label: "billing.invoices_hourly",
    target: "s-runs",
  },
  {
    group: "Pipeline",
    icon: Workflow,
    id: "p3",
    label: "sync.customer_360_nightly",
    target: "s-sync",
  },
  { group: "Warehouse", icon: HardDrive, id: "w1", label: "wh-ledger-prod", target: "s-spend" },
  { group: "Table", icon: Database, id: "t1", label: "crm.contacts", target: "s-drift" },
  { group: "Action", icon: RotateCcw, id: "a1", label: "Retry failed runs" },
  { group: "Action", icon: Pause, id: "a2", label: "Pause all schedules" },
  { group: "Action", icon: Play, id: "a3", label: "Cap growth-data spend", target: "s-spend" },
];

const MENU = [
  { icon: FileText, id: "logs", label: "View logs" },
  { icon: RotateCcw, id: "retry", label: "Retry run", shortcut: "R" },
  { icon: Copy, id: "copy", label: "Copy run ID", shortcut: "C" },
  { icon: Ban, id: "cancel", label: "Cancel run", separatorBefore: true, tone: "fail" as const },
];

export const Overlays = ({ onCommand }: { onCommand: () => void }) => {
  const push = useToast();
  const [drop, setDrop] = useState(false);
  const [typed, setTyped] = useState("");
  const [pop, setPop] = useState(false);
  const [menu, setMenu] = useState(false);
  const [last, setLast] = useState("none yet");

  return (
    <Group {...groupHead("overlays")}>
      <Sheet>
        <SpecCell
          edge
          name="Dialog"
          note="A panel over the dimmed sheet, driven by open and onOpenChange. When the action is a loss, red is the only strong button inside."
          path="overlays/dialog"
        >
          <Button
            onClick={() => {
              setDrop(true);
            }}
          >
            Drop table
          </Button>
          <Dialog
            footer={
              <>
                <Button
                  onClick={() => {
                    setDrop(false);
                  }}
                  variant="ghost"
                >
                  Keep table
                </Button>
                <Button
                  disabled={typed !== "staging.events_old"}
                  onClick={() => {
                    setDrop(false);
                    setTyped("");
                    push({
                      detail: "2.4 TB freed",
                      status: "ok",
                      title: "Dropped staging.events_old",
                    });
                  }}
                  variant="danger"
                >
                  Drop table
                </Button>
              </>
            }
            meta="2.4 TB"
            onOpenChange={setDrop}
            open={drop}
            title="Drop staging.events_old"
          >
            <p className="hx-body-sm">
              This deletes 1,912 files and 88 days of events. Nothing reads from this table, but it
              cannot be restored.
            </p>
            <label className="hx-field">
              <span className="hx-label-sm hx-ink-2">Type the table name to confirm</span>
              <Input
                data-autofocus
                mono
                onChange={(event) => {
                  setTyped(event.target.value);
                }}
                placeholder="staging.events_old"
                value={typed}
              />
            </label>
          </Dialog>
        </SpecCell>
        <SpecCell
          name="Popover"
          note="A small panel pinned under the control that opened it. Escape or a click elsewhere puts it away."
          path="overlays/popover"
        >
          <Popover
            label="Partition 2026-11-24/14"
            onOpenChange={setPop}
            open={pop}
            renderTrigger={(props) => (
              <Button {...props} variant="plain">
                Partition 14
              </Button>
            )}
          >
            <span className="hx-code">2026-11-24/14</span>
            <DataList
              items={[
                { label: "Rows", value: "61,208" },
                { label: "Size", value: "412 MB" },
                { label: "Written", value: "03:18 UTC" },
              ]}
            />
          </Popover>
        </SpecCell>
        <SpecCell
          edge
          name="Tooltip"
          note="Gives a square glyph button its name, on hover and on keyboard focus. Nothing inside it is clickable."
          path="overlays/tooltip"
        >
          <div className="hx-row">
            <Tooltip
              label="Replay run"
              renderTrigger={(props) => (
                <Button {...props} aria-label="Replay run" size="icon" variant="ghost">
                  <Icon icon={RotateCcw} />
                </Button>
              )}
            />
            <Tooltip
              label="Copy run ID"
              renderTrigger={(props) => (
                <Button {...props} aria-label="Copy run ID" size="icon" variant="ghost">
                  <Icon icon={Copy} />
                </Button>
              )}
            />
            <Tooltip
              label="Run details"
              renderTrigger={(props) => (
                <Button {...props} aria-label="Run details" size="icon" variant="ghost">
                  <Icon icon={Info} />
                </Button>
              )}
            />
          </div>
        </SpecCell>
        <SpecCell
          name="Dropdown menu"
          note="Everything you can do to one row. Anything destructive comes last, below a rule, in red."
          path="overlays/dropdown-menu"
        >
          <div className="hx-row">
            <span className="hx-code">run_7c41e0</span>
            <DropdownMenu
              items={MENU}
              label="Run actions"
              onOpenChange={setMenu}
              onSelect={(id) => {
                setLast(MENU.find((item) => item.id === id)?.label ?? id);
              }}
              open={menu}
              renderTrigger={(props) => (
                <Button {...props} aria-label="Run actions" size="icon-sm" variant="ghost">
                  <MoreGlyph />
                </Button>
              )}
            />
          </div>
          <span className="hx-code-sm hx-ink-3">Last chosen: {last}</span>
        </SpecCell>
        <SpecCell
          name="Command"
          note="One search over every place and action. Type to narrow, arrows to move, Enter to go, Escape to leave."
          path="overlays/command"
          wide
        >
          <div className="hx-row-wrap">
            <Button onClick={onCommand}>Open command menu</Button>
            <span className="hx-row hx-body-sm hx-ink-2 hx-gap-1">
              or press <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </div>
        </SpecCell>
      </Sheet>
    </Group>
  );
};

export const CommandHost = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const push = useToast();

  return (
    <CommandPalette
      items={COMMANDS}
      onOpenChange={onOpenChange}
      onRun={(item) => {
        const target =
          item.target !== undefined && item.target !== ""
            ? document.querySelector<HTMLElement>(`#${item.target}`)
            : null;

        if (!target) {
          push({ detail: item.group, status: "ok", title: `Ran ${item.label}` });

          return;
        }

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            target.focus({ preventScroll: true });
            target.scrollIntoView({
              behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
              block: "start",
            });
          });
        });
      }}
      open={open}
    />
  );
};
