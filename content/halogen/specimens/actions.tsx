import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useState } from "react";

import { Button, ButtonGroup } from "../components/button";
import { CopyButton } from "../components/copy-button";
import { Icon } from "../components/icon";
import { Group, Sheet, SpecCell } from "../components/page";
import { groupHead } from "./catalog";

export const Actions = () => {
  const [pending, setPending] = useState(false);
  const [run, setRun] = useState(41);

  return (
    <Group {...groupHead("actions")}>
      <Sheet>
        <SpecCell
          name="Button"
          note="Each frame, foot row or dialog gets one lit button at most. A loss is red and keeps a plain way back beside it. Every label names a verb and what it acts on."
          path="actions/button"
          wide
        >
          <div className="hx-btn-rows">
            <span className="hx-label-sm hx-ink-3">Commit</span>
            <div className="hx-row-wrap">
              <Button variant="ghost">Cancel</Button>
              <Button>View logs</Button>
              <Button
                onClick={() => {
                  setPending(true);
                  window.setTimeout(() => {
                    setPending(false);
                  }, 1800);
                }}
                pending={pending}
                pendingLabel="Deploying"
                variant="lamp"
              >
                Deploy pipeline
              </Button>
            </div>
            <span className="hx-label-sm hx-ink-3">Loss</span>
            <div className="hx-row-wrap">
              <Button>Keep queue</Button>
              <Button variant="danger">Purge queue</Button>
              <Button disabled>Locked</Button>
            </div>
            <span className="hx-label-sm hx-ink-3">Sizes</span>
            <div className="hx-row-wrap">
              <Button size="sm">Small 28</Button>
              <Button>Default 32</Button>
              <Button size="lg">Large 36</Button>
              <Button aria-label="Refresh" size="icon" title="Refresh">
                <Icon icon={RefreshCw} />
              </Button>
              <Button aria-label="Refresh" size="icon-sm" title="Refresh" variant="ghost">
                <Icon icon={RefreshCw} />
              </Button>
            </div>
          </div>
        </SpecCell>
        <SpecCell
          edge
          name="Button group"
          note="Sibling actions fused along one shared rule. None of them is ever lit."
          path="actions/button-group"
        >
          <div className="hx-row-wrap">
            <ButtonGroup label="Move between runs">
              <Button
                aria-label="Previous run"
                onClick={() => {
                  setRun(Math.max(1, run - 1));
                }}
                size="icon"
              >
                <Icon icon={ChevronLeft} />
              </Button>
              <Button>Run {run} of 48</Button>
              <Button
                aria-label="Next run"
                onClick={() => {
                  setRun(Math.min(48, run + 1));
                }}
                size="icon"
              >
                <Icon icon={ChevronRight} />
              </Button>
            </ButtonGroup>
            <ButtonGroup label="Export">
              <Button size="sm">CSV</Button>
              <Button size="sm">Parquet</Button>
              <Button size="sm">JSON</Button>
            </ButtonGroup>
          </div>
        </SpecCell>
        <SpecCell
          name="Copy button"
          note="Sits at the far end of a head row. It reads Copied for a beat, then goes back to its glyph."
          path="actions/copy-button"
        >
          <div className="hx-frame hx-row hx-copy-field">
            <span className="hx-code hx-grow hx-truncate">hx_live_7f3c9a2e41d0b6</span>
            <CopyButton label="Copy key" value="hx_live_7f3c9a2e41d0b6" />
          </div>
        </SpecCell>
      </Sheet>
    </Group>
  );
};
