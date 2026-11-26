"use client";

import { Copy, Ellipsis, Info, Pencil, RotateCcw, X } from "lucide-react";
import { useState } from "react";

import { Button } from "../components/button";
import { Dialog } from "../components/dialog";
import { Menu } from "../components/menu";
import { Popover } from "../components/popover";
import { Tooltip } from "../components/tooltip";
import { Specimen } from "../chrome";
import { useLater } from "../lib/hooks";

/** Dialog, popover, tooltip and dropdown menu, all lifted by a ring. */
export const Overlays = () => {
  const [dialog, setDialog] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [access, setAccess] = useState<"granted" | "revoked">("granted");
  const [info, setInfo] = useState(false);
  const [last, setLast] = useState("Nothing chosen yet");
  const [tipped, setTipped] = useState("Hover or focus an icon");
  const later = useLater();

  return (
    <>
      <Specimen
        name="Dialog"
        note="a shell over the scrim; one lead, coral when it cannot be undone"
      >
        <div className="v-stack v-text-center">
          <p aria-live="polite" className="v-body-sm v-t2">
            {access === "granted"
              ? "The support agent can write to the CRM."
              : "CRM access revoked."}
          </p>
          <Button
            disabled={access === "revoked"}
            onClick={() => {
              setDialog(true);
            }}
            variant="secondary"
          >
            Revoke CRM access
          </Button>
          {access === "revoked" ? (
            <Button
              onClick={() => {
                setAccess("granted");
              }}
              size="sm"
              variant="ghost"
            >
              Reconnect
            </Button>
          ) : null}
        </div>
        <Dialog
          description="The support agent stops updating customer records at once. Replies it already sent stay sent."
          footer={
            <>
              <Button
                data-autofocus=""
                onClick={() => {
                  setDialog(false);
                }}
                size="sm"
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setRevoking(true);
                  later(() => {
                    setRevoking(false);
                    setAccess("revoked");
                    setDialog(false);
                  }, 900);
                }}
                pending={revoking}
                pendingLabel="Revoking"
                size="sm"
                variant="destructive"
              >
                Revoke access
              </Button>
            </>
          }
          meta="Granted by Ruth, 14 Mar"
          onOpenChange={setDialog}
          open={dialog}
          role="alertdialog"
          title="Revoke CRM access?"
        />
      </Specimen>
      <Specimen name="Popover" note="a few lines beside its trigger, 4px in from it">
        <div className="v-cluster v-center">
          <span className="v-body-sm">Context window</span>
          <Popover
            onOpenChange={setInfo}
            open={info}
            title="About the context window"
            renderTrigger={(props) => (
              <Button
                {...props}
                aria-label="About the context window"
                size="icon-sm"
                variant="ghost"
              >
                <Info aria-hidden />
              </Button>
            )}
          >
            <div className="v-stack-sm">
              <p className="v-label">Context window</p>
              <p className="v-body-sm v-t2">
                How much of the thread the agent rereads each turn. Older turns are summarised into
                one line each.
              </p>
              <div className="v-cluster v-end">
                <Button
                  onClick={() => {
                    setInfo(false);
                  }}
                  size="sm"
                  variant="secondary"
                >
                  <X aria-hidden />
                  Close
                </Button>
              </div>
            </div>
          </Popover>
        </div>
      </Specimen>
      <Specimen name="Tooltip" note="ink, after a 400ms rest, never the only way to the info">
        <div className="v-stack v-text-center">
          <div className="v-cluster v-center v-gap-2">
            <Tooltip
              content="Copy run ID"
              render={(props) => (
                <Button
                  {...props}
                  aria-label="Copy run ID"
                  onClick={() => {
                    setTipped("Run ID copied");
                  }}
                  size="icon"
                  variant="ghost"
                >
                  <Copy aria-hidden />
                </Button>
              )}
            />
            <Tooltip
              content="Run again"
              render={(props) => (
                <Button
                  {...props}
                  aria-label="Run again"
                  onClick={() => {
                    setTipped("Queued the run again");
                  }}
                  size="icon"
                  variant="ghost"
                >
                  <RotateCcw aria-hidden />
                </Button>
              )}
            />
            <Tooltip
              content="Rename run"
              render={(props) => (
                <Button
                  {...props}
                  aria-label="Rename run"
                  onClick={() => {
                    setTipped("Renaming the run");
                  }}
                  size="icon"
                  variant="ghost"
                >
                  <Pencil aria-hidden />
                </Button>
              )}
            />
          </div>
          <span aria-live="polite" className="v-caption v-t2">
            {tipped}
          </span>
        </div>
      </Specimen>
      <Specimen name="Dropdown menu" note="arrow keys move, Escape returns to the trigger">
        <div className="v-stack v-text-center">
          <Menu
            align="start"
            items={[
              {
                icon: <Copy aria-hidden />,
                label: "Duplicate agent",
                onSelect: () => {
                  setLast("Duplicated as Docs answerer 2");
                },
              },
              {
                icon: <Pencil aria-hidden />,
                label: "Rename agent",
                onSelect: () => {
                  setLast("Renaming the agent");
                },
              },
              "separator",
              {
                label: "Archive agent",
                onSelect: () => {
                  setLast("Archived; restore it from Settings");
                },
                tone: "fail",
              },
            ]}
            label="Agent actions"
            renderTrigger={(props) => (
              <Button {...props} variant="secondary">
                Docs answerer
                <Ellipsis aria-hidden />
              </Button>
            )}
          />
          <span aria-live="polite" className="v-caption v-t2">
            {last}
          </span>
        </div>
      </Specimen>
    </>
  );
};
