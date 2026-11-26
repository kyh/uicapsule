import { Ellipsis, Flag, Info, Lock, NotebookPen, ShoppingBag, Split, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "../components/button";
import { Dialog } from "../components/dialog";
import { Input } from "../components/field";
import { ListIcon } from "../components/list";
import { Menu } from "../components/menu";
import type { MenuTriggerProps } from "../components/menu";
import { Popover } from "../components/popover";
import type { TriggerProps } from "../components/popover";
import { Switch } from "../components/switch";
import { Tooltip } from "../components/tooltip";
import type { TooltipTriggerProps } from "../components/tooltip";
import { useToast } from "../components/toast";
import { formatAmount } from "../lib/format";
import { Specimen } from "../shell";

import "./specimens.css";

const renderFeeTrigger = (props: TriggerProps) => (
  <Button icon={<Info aria-hidden size={16} strokeWidth={1.75} />} variant="outline" {...props}>
    Same day fee
  </Button>
);

const renderMoreTrigger = (props: MenuTriggerProps) => (
  <Button aria-label="More for Saltgrass Kitchen" size="icon" variant="secondary" {...props}>
    <Ellipsis aria-hidden size={20} strokeWidth={1.75} />
  </Button>
);

const renderRateTrigger = (props: TooltipTriggerProps) => (
  <Button variant="ghost" {...props}>
    3.1% a year
  </Button>
);

const renderLockTrigger = (props: TooltipTriggerProps) => (
  <Button
    icon={<Lock aria-hidden size={16} strokeWidth={1.75} />}
    size="sm"
    variant="secondary"
    {...props}
  >
    Card ··2208 locked
  </Button>
);

export const OverlaySpecimens = () => {
  const toast = useToast();
  const [dialog, setDialog] = useState(false);
  const [alert, setAlert] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [popover, setPopover] = useState(false);
  const [menu, setMenu] = useState(false);
  const [name, setName] = useState("Kyoto in April");
  const [tell, setTell] = useState(true);
  const [weekly, setWeekly] = useState(false);
  const [noted, setNoted] = useState(false);
  const [split, setSplit] = useState(false);
  const [locked, setLocked] = useState(false);
  const [reported, setReported] = useState(false);

  return (
    <>
      <Specimen
        name="Dialog"
        note="Sized by token with 28px corners, grows in from 0.96 on the slow duration, and is always driven by open and onOpenChange."
      >
        <Button
          onClick={() => {
            setDialog(true);
          }}
          variant="secondary"
        >
          Rename goal
        </Button>
        <Dialog
          description="Only you see this name. The money in it stays put."
          footer={
            <>
              <Button
                onClick={() => {
                  setDialog(false);
                }}
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setDialog(false);
                  toast.show({ title: `Renamed to ${name}` });
                }}
              >
                Save name
              </Button>
            </>
          }
          onOpenChange={setDialog}
          open={dialog}
          title="Rename goal"
        >
          <Input
            label="Goal name"
            onChange={(event) => {
              setName(event.target.value);
            }}
            value={name}
          />
        </Dialog>
      </Specimen>
      <Specimen
        name="Dialog, alert kind"
        note="For a choice that cannot wait. Escape still cancels, but a press outside does not, and red appears only on the confirm."
      >
        <Button
          icon={<Trash2 aria-hidden size={16} strokeWidth={1.75} />}
          onClick={() => {
            setAlert(true);
          }}
          variant="outline"
        >
          Delete goal
        </Button>
        <Dialog
          description="The $1,140.00 saved so far goes back to Everyday. Past moves stay in Activity."
          footer={
            <>
              <Button
                onClick={() => {
                  setAlert(false);
                }}
                variant="ghost"
              >
                Keep goal
              </Button>
              <Button
                onClick={() => {
                  setAlert(false);
                  toast.show({ title: "Deleted Kyoto in April" });
                }}
                variant="destructive"
              >
                Delete goal
              </Button>
            </>
          }
          kind="alert"
          onOpenChange={setAlert}
          open={alert}
          size="sm"
          title="Delete Kyoto in April?"
        />
      </Specimen>
      <Specimen
        name="Dialog, sheet kind"
        note="Slides from the right on a wide screen and up from the bottom on a phone, as tall as its content. Settings save as you flip them; Done just closes."
      >
        <Button
          onClick={() => {
            setSheet(true);
          }}
          variant="secondary"
        >
          Clementine settings
        </Button>
        <Dialog
          footer={
            <Button
              block
              onClick={() => {
                setSheet(false);
              }}
              size="lg"
              variant="solid"
            >
              Done
            </Button>
          }
          kind="sheet"
          onOpenChange={setSheet}
          open={sheet}
          title="Clementine settings"
        >
          <Switch
            checked={tell}
            description="One line in the chat each time it moves money for you"
            label="Report every move"
            onCheckedChange={setTell}
          />
          <Switch
            checked={weekly}
            description="A short look back every Sunday at 6:00 pm"
            label="Sunday recap"
            onCheckedChange={setWeekly}
          />
        </Dialog>
      </Specimen>
      <Specimen
        name="Popover"
        note="Hangs from its trigger, grows in from 0.96, and closes on Escape, which hands focus back, or on a press outside."
      >
        <Popover
          onOpenChange={setPopover}
          open={popover}
          title="About this fee"
          trigger={renderFeeTrigger}
        >
          <p className="cl-pop-title">Same day is $1.50</p>
          <p className="cl-pop-text">
            Send before 4:00 pm on a working day and it lands before 6:00 pm. Standard is free and
            takes one or two working days.
          </p>
        </Popover>
      </Specimen>
      <Specimen
        name="Dropdown menu"
        note="Actions for one payment, on a raised panel with 8px items inside its 20px corners. Arrow keys move; Escape or a choice returns focus to the button."
      >
        <div className="cl-menu-demo">
          <span className="cl-menu-demo__row">
            <ListIcon icon={ShoppingBag} />
            <span className="cl-row__text">
              <span className="cl-row__title">Saltgrass Kitchen</span>
              <span aria-live="polite" className="cl-row__desc">
                {[
                  "Nov 17",
                  noted ? "Note: Amara's birthday dinner" : null,
                  split ? "Split three ways" : null,
                  locked ? "Card ··2208 locked" : null,
                  reported ? "Reported to us" : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <span>{formatAmount(split ? -39.47 : -118.4)}</span>
          </span>
          <Menu
            items={[
              {
                icon: <NotebookPen aria-hidden size={16} strokeWidth={1.75} />,
                label: noted ? "Remove note" : "Add a note",
                onSelect: () => {
                  setNoted(!noted);
                },
              },
              {
                icon: <Split aria-hidden size={16} strokeWidth={1.75} />,
                label: split ? "Undo the split" : "Split three ways",
                onSelect: () => {
                  setSplit(!split);
                },
              },
              {
                icon: <Lock aria-hidden size={16} strokeWidth={1.75} />,
                label: locked ? "Unlock card ··2208" : "Lock card ··2208",
                onSelect: () => {
                  setLocked(!locked);
                },
              },
              {
                danger: true,
                icon: <Flag aria-hidden size={16} strokeWidth={1.75} />,
                label: reported ? "Withdraw report" : "Report payment",
                onSelect: () => {
                  setReported(!reported);
                },
              },
            ]}
            align="end"
            label="Payment actions"
            onOpenChange={setMenu}
            open={menu}
            trigger={renderMoreTrigger}
          />
        </div>
      </Specimen>
      <Specimen
        name="Tooltip"
        note="Ink, after a short wait on hover and at once on focus. It only spells out what the trigger already says, so no fact lives in it alone."
      >
        <div className="cl-spec-row">
          <Tooltip content="3.1% interest a year">{renderRateTrigger}</Tooltip>
          <Tooltip content="The card ending 2208 is locked">{renderLockTrigger}</Tooltip>
        </div>
      </Specimen>
    </>
  );
};
