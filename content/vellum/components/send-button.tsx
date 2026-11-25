import { ArrowUp, Square } from "lucide-react";

import { Arc } from "./arc";
import { Button } from "./button";

export type SendStatus = "ready" | "submitted" | "streaming" | "stopping" | "error";

const NAME = {
  error: "Send again",
  ready: "Send",
  stopping: "Stopping",
  streaming: "Stop",
  submitted: "Stop",
} satisfies Record<SendStatus, string>;

/** The glass key in the composer, turning from send to stop while a reply is under way. */
export const SendButton = ({
  status,
  empty,
  onSend,
  onStop,
  size = "icon-sm",
}: {
  status: SendStatus;
  empty: boolean;
  onSend: () => void;
  onStop: () => void;
  size?: "icon-sm" | "icon";
}) => {
  const working = status === "submitted" || status === "streaming" || status === "stopping";
  const blocked = !working && empty;

  return (
    <Button
      aria-busy={status === "stopping" || undefined}
      aria-keyshortcuts={working ? "Escape" : "Enter"}
      aria-label={NAME[status]}
      disabled={blocked}
      onClick={() => {
        if (status === "stopping") {
          return;
        }

        if (working) {
          onStop();
        } else {
          onSend();
        }
      }}
      size={size}
    >
      {status === "stopping" ? <Arc small={size === "icon-sm"} /> : null}
      {status === "submitted" || status === "streaming" ? (
        <Square aria-hidden className="v-stop-glyph" fill="currentColor" />
      ) : null}
      {working ? null : <ArrowUp aria-hidden strokeWidth={2} />}
    </Button>
  );
};
