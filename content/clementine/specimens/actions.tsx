import { ArrowUpRight, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "../components/button";
import { CopyButton } from "../components/copy-button";
import { Specimen } from "../shell";

import "./specimens.css";

export const ActionSpecimens = () => {
  const [sending, setSending] = useState(false);

  return (
    <>
      <Specimen
        name="Button"
        note="Primary wears the zest ring and appears once per view. Solid ink carries the second strongest action; the rest stay on paper."
        wide
      >
        <div className="cl-spec-col">
          <div className="cl-spec-row">
            <Button>Send money</Button>
            <Button variant="solid">Lock card</Button>
            <Button variant="secondary">Request</Button>
            <Button variant="outline">Share</Button>
            <Button variant="ghost">Not now</Button>
            <Button variant="link">See terms</Button>
          </div>
          <div className="cl-spec-row">
            <Button size="sm" variant="secondary">
              Small 36
            </Button>
            <Button variant="secondary">Medium 44</Button>
            <Button size="lg" variant="secondary">
              Large 52
            </Button>
            <Button aria-label="Add money" size="icon" variant="secondary">
              <Plus aria-hidden size={20} strokeWidth={1.75} />
            </Button>
            <Button
              icon={<ArrowUpRight aria-hidden size={16} strokeWidth={1.75} />}
              variant="outline"
            >
              Send
            </Button>
          </div>
          <div className="cl-spec-row">
            <Button
              onClick={() => {
                setSending(true);
                window.setTimeout(() => {
                  setSending(false);
                }, 1600);
              }}
              pending={sending}
              variant="solid"
            >
              Pay bill
            </Button>
            <Button disabled>Continue</Button>
            <Button variant="destructive">Close account</Button>
            <span className="cl-note">The red glow only ever confirms, inside a dialog.</span>
          </div>
        </div>
      </Specimen>
      <Specimen
        name="Copy button"
        note="Copies the value, trades its icon for a tick for two seconds and announces it. The words never change."
      >
        <div className="cl-spec-col">
          <div className="cl-copy-line">
            <span className="cl-mono">GB29 HRBR 6016 1331 9268 19</span>
            <CopyButton label="Copy" value="GB29 HRBR 6016 1331 9268 19" />
          </div>
          <div className="cl-copy-line">
            <span>clementine.app/pay/noor</span>
            <CopyButton label="Copy link" value="https://clementine.app/pay/noor" />
          </div>
        </div>
      </Specimen>
    </>
  );
};
