import { useState } from "react";

import { Alert } from "../components/alert";
import { Button } from "../components/button";
import { CodeWindow } from "../components/code";
import { CopyButton } from "../components/copy-button";
import { Frame, FrameHead } from "../components/frame";
import { Progress } from "../components/meter";
import { Popover } from "../components/popover";
import { ToolCallRow, ToolCallStack } from "../components/runs";
import { SchemaDiff } from "../components/schema-diff";
import { Status } from "../components/status";
import { StatusStrip, StripCell } from "../components/status-strip";
import { useToast } from "../components/toast";
import { full } from "../lib/format";
import { useInterval } from "../lib/motion";
import { DEFAULT_CHOICES, DRIFT_ROWS, HELD_MODELS, QUARANTINED, mappingSql } from "./drift-data";
import type { Resolution } from "./drift-data";

type Phase = "held" | "applying" | "released";

const BATCH = 6000;

/** Demo: a source changed shape overnight. The diff picks a resolution per column and writes the mapping; Apply replays the held rows. */
export const DriftScreen = () => {
  const push = useToast();
  const [phase, setPhase] = useState<Phase>("held");
  const [choices, setChoices] = useState<Record<string, Resolution>>(DEFAULT_CHOICES);
  const [replayed, setReplayed] = useState(0);
  const [holding, setHolding] = useState(false);
  const [lineage, setLineage] = useState(false);
  const mapping = mappingSql(choices);

  useInterval(
    () => {
      const next = Math.min(QUARANTINED, replayed + BATCH);

      setReplayed(next);

      if (next === QUARANTINED) {
        setPhase("released");
        push({
          detail: `${full(QUARANTINED)} rows · ${HELD_MODELS.length} models released`,
          status: "ok",
          title: "crm.contacts mapped to v7",
        });
      }
    },
    450,
    phase === "applying",
  );

  const reset = () => {
    setPhase("held");
    setReplayed(0);
    setChoices(DEFAULT_CHOICES);
    setHolding(false);
  };

  const changes = DRIFT_ROWS.length;
  const held = phase === "released" ? 0 : QUARANTINED - replayed;

  const headStatus = {
    applying: (
      <Status live status="running">
        Replaying
      </Status>
    ),
    held: (
      <Status live status="warn">
        Drifted
      </Status>
    ),
    released: (
      <Status live status="ok">
        Mapped
      </Status>
    ),
  }[phase];

  const replayState = { applying: "running", held: "queued", released: "done" } as const;

  return (
    <div className="hx-drift">
      <div className="hx-stack hx-gap-0">
        <div className="hx-row hx-stack-head">
          <span className="hx-label-sm hx-ink-3">Steps</span>
          <span className="hx-code-sm hx-ink-3 hx-end">drift_4ac1</span>
        </div>
        <ToolCallStack label="Steps of drift_4ac1">
          <ToolCallRow detail="crm-api v7" label="Fetch schema" seconds={1} state="done" />
          <ToolCallRow detail={`${changes} changes`} label="Diff schema" seconds={3} state="done" />
          <ToolCallRow
            detail={`${full(QUARANTINED)} rows`}
            label="Quarantine rows"
            seconds={48}
            state="done"
          />
          <ToolCallRow
            detail="staging.contacts_v7_map"
            label="Map columns"
            state={phase === "held" ? "waiting" : "done"}
            tab={phase === "held" ? "Needs a person" : undefined}
          >
            {phase === "held" ? (
              <p className="hx-caption hx-ink-2">
                {holding
                  ? "Held on purpose. Nothing replays until the hold is lifted."
                  : "Pick a resolution for each change, then apply the mapping."}
              </p>
            ) : null}
          </ToolCallRow>
          <ToolCallRow
            detail={`${full(replayed)} of ${full(QUARANTINED)}`}
            label="Replay rows"
            seconds={phase === "released" ? 4 : undefined}
            state={replayState[phase]}
            tab={phase === "applying" ? "Replaying" : undefined}
          />
          <ToolCallRow
            detail={`${HELD_MODELS.length} models`}
            label="Release models"
            state={phase === "released" ? "done" : "queued"}
          />
        </ToolCallStack>
      </div>

      <Frame label="Schema drift on crm.contacts">
        <FrameHead
          actions={<CopyButton label="Copy drift ID" value="drift_4ac1" />}
          meta="v6 → v7 · 06:20 UTC"
          status={headStatus}
          title="crm.contacts"
        />
        {phase === "released" ? (
          <Alert tone="ok" word="Mapped">
            The v7 mapping is live in <code>staging.contacts_v7_map</code>. All held rows replayed
            and {HELD_MODELS.length} downstream models rebuilt.
          </Alert>
        ) : (
          <Alert tone="warn" word="Source changed shape">
            <code>crm-api</code> shipped contacts v7 at 06:20 UTC. Rows that no longer fit
            core.contacts are in quarantine, and the {HELD_MODELS.length} models that read them are
            on hold.
          </Alert>
        )}
        <StatusStrip label="Drift facts" plain>
          <StripCell label="Columns changed" value={changes} />
          <StripCell label="Rows held" value={full(held)} />
          <StripCell
            label="Models held"
            unit={`/ ${HELD_MODELS.length}`}
            value={phase === "released" ? 0 : HELD_MODELS.length}
          />
          <StripCell label="Detected" unit="UTC" value="06:20" />
        </StatusStrip>
        <SchemaDiff
          choices={choices}
          from="v6"
          label="Column changes between v6 and v7"
          locked={phase !== "held"}
          onChoose={(id, value: Resolution) => setChoices({ ...choices, [id]: value })}
          rows={DRIFT_ROWS}
          to="v7"
        />
        <div className="hx-split hx-drift-split">
          <CodeWindow
            code={mapping.code}
            meta={phase === "held" ? "draft" : "applied"}
            name="contacts_v7_map.sql"
            plain
            washLines={phase === "held" ? mapping.changed : []}
          />
          <div className="hx-body-pad">
            <Progress
              cells={16}
              done={replayed}
              label="Replayed"
              live={phase === "applying"}
              reading={`${full(replayed)} / ${full(QUARANTINED)}`}
              total={QUARANTINED}
            />
            <span className="hx-label-sm hx-ink-3">
              {phase === "released" ? "Released from hold" : "Waiting on this table"}
            </span>
            <span className="hx-row-wrap hx-gap-1">
              {HELD_MODELS.slice(0, 4).map((model) => (
                <span
                  className="hx-chip"
                  data-released={phase === "released" || undefined}
                  key={model.name}
                >
                  {model.name}
                </span>
              ))}
              <span className="hx-code-sm hx-ink-3">+{HELD_MODELS.length - 4} more</span>
            </span>
          </div>
        </div>
        <footer className="hx-foot">
          {phase === "released" ? (
            <Button onClick={reset} variant="ghost">
              Replay incident
            </Button>
          ) : (
            <Button
              aria-pressed={holding}
              disabled={phase === "applying"}
              onClick={() => setHolding(!holding)}
              variant="ghost"
            >
              {holding ? "Holding" : "Hold drift"}
            </Button>
          )}
          <span className="hx-row hx-end">
            <Popover
              label="Models downstream of crm.contacts"
              onOpenChange={setLineage}
              open={lineage}
              side="top"
              renderTrigger={(props) => <Button {...props}>Lineage</Button>}
            >
              <span className="hx-label-sm hx-ink-3">Reads crm.contacts</span>
              <ul className="hx-lineage">
                {HELD_MODELS.map((model) => (
                  <li key={model.name}>
                    <span className="hx-code-sm">{model.name}</span>
                    <span className="hx-code-sm hx-ink-3">{model.owner}</span>
                  </li>
                ))}
              </ul>
            </Popover>
            <Button
              disabled={phase === "released" || holding}
              onClick={() => setPhase("applying")}
              pending={phase === "applying"}
              pendingLabel="Replaying"
              variant="lamp"
            >
              Apply mapping
            </Button>
          </span>
        </footer>
      </Frame>
    </div>
  );
};
