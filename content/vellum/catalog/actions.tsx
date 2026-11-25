"use client";

import { Ellipsis, Link2, Pencil, Plus, Undo2 } from "lucide-react";
import { useState } from "react";

import { Button } from "../components/button";
import { CopyButton } from "../components/copy-button";
import { Menu } from "../components/menu";
import { Tooltip } from "../components/tooltip";
import { Specimen } from "../chrome";
import { useLater } from "../lib/hooks";

/** Button, its sizes and states, and the quiet toolbar around a draft. */
export const Actions = () => {
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState("Draft saved 2 min ago");
  const [sending, setSending] = useState(false);
  const later = useLater();

  return (
    <>
      <Specimen
        name="Button"
        note="ink, vermilion and verdigris glass, then flat and bare"
        span={2}
      >
        <div className="v-cluster v-center v-gap-16">
          <Button>Run eval</Button>
          <Button variant="destructive">Delete agent</Button>
          <Button variant="confirm">Approve plan</Button>
          <Button variant="secondary">Edit prompt</Button>
          <Button variant="ghost">Skip</Button>
        </div>
      </Specimen>
      <Specimen name="Button sizes" note="26, 32 and 36px, icon sizes square">
        <div className="v-cluster v-center">
          <Button size="sm">Deploy</Button>
          <Button>Deploy</Button>
          <Button size="lg">Deploy</Button>
        </div>
        <div className="v-cluster v-center">
          <Button aria-label="Add a step" size="icon-sm" variant="secondary">
            <Plus aria-hidden />
          </Button>
          <Button aria-label="Add a step" size="icon" variant="secondary">
            <Plus aria-hidden />
          </Button>
          <Button aria-label="Add a step" size="icon-lg" variant="secondary">
            <Plus aria-hidden />
          </Button>
        </div>
      </Specimen>
      <Specimen name="Button states" note="held, disabled, pending; press Publish">
        <div className="v-cluster v-center">
          <Button held>Held</Button>
          <Button disabled>Publish</Button>
          <Button
            onClick={() => {
              setPending(true);
              later(() => setPending(false), 1800);
            }}
            pending={pending}
            pendingLabel="Publishing"
          >
            Publish
          </Button>
        </div>
      </Specimen>
      <Specimen
        name="Toolbar"
        note="bare icon buttons that name themselves on rest, and an overflow"
        span={2}
      >
        <div className="v-between v-wrap">
          <div aria-label="Draft actions" className="v-cluster v-gap-2" role="toolbar">
            <Tooltip
              content="Edit draft"
              render={(props) => (
                <Button {...props} aria-label="Edit draft" size="icon-sm" variant="ghost">
                  <Pencil aria-hidden />
                </Button>
              )}
            />
            <Tooltip
              content="Undo last change"
              render={(props) => (
                <Button
                  {...props}
                  aria-label="Undo last change"
                  onClick={() => setSaved("Undid the last change")}
                  size="icon-sm"
                  variant="ghost"
                >
                  <Undo2 aria-hidden />
                </Button>
              )}
            />
            <Tooltip
              content="Copy link"
              render={(props) => (
                <span {...props} className="v-inline-flex">
                  <CopyButton
                    label="Copy link to draft"
                    value="https://vellum.example/d/reply-ticket-4471"
                  />
                </span>
              )}
            />
            <Menu
              align="start"
              items={[
                {
                  icon: <Link2 aria-hidden />,
                  label: "Copy share link",
                  onSelect: () => setSaved("Link copied"),
                },
                {
                  icon: <Pencil aria-hidden />,
                  label: "Rename draft",
                  onSelect: () => setSaved("Renamed"),
                },
                "separator",
                {
                  label: "Delete draft",
                  onSelect: () => setSaved("Deleted, undo from the bin"),
                  tone: "fail",
                },
              ]}
              label="More for this draft"
              renderTrigger={(props) => (
                <Button {...props} aria-label="More for this draft" size="icon-sm" variant="ghost">
                  <Ellipsis aria-hidden />
                </Button>
              )}
            />
          </div>
          <span aria-live="polite" className="v-caption v-t2">
            {saved}
          </span>
          <div className="v-cluster">
            <Button
              onClick={() => setSaved("Previewing as the customer sees it")}
              size="sm"
              variant="secondary"
            >
              Preview
            </Button>
            <Button
              onClick={() => {
                setSending(true);
                later(() => {
                  setSending(false);
                  setSaved("Sent to ticket 4471");
                }, 1200);
              }}
              pending={sending}
              pendingLabel="Sending"
              size="sm"
            >
              Send reply
            </Button>
          </div>
        </div>
      </Specimen>
    </>
  );
};
