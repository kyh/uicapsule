import type { StatusKind } from "./status";

/** The last runs as a strip of narrow ink marks; only a failure takes colour. */
export const StatusStrip = ({
  label,
  runs,
  from,
  to,
}: {
  label: string;
  runs: readonly StatusKind[];
  from: string;
  to: string;
}) => {
  const failed = runs.filter((run) => run === "fail").length;

  return (
    <div className="v-stack-sm">
      <p className="v-sr">{`${label}: ${runs.length} runs, ${failed} failed`}</p>
      <div aria-hidden className="v-strip">
        {runs.map((run, index) => (
          <span data-status={run} key={`${index}-${run}`} />
        ))}
      </div>
      <div className="v-between v-caption v-t2">
        <span>{from}</span>
        <span>{to}</span>
      </div>
    </div>
  );
};
