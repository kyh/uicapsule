import { Minor } from "../chrome";
import { figure, useSettings } from "../lib/settings";

const SCALE = [
  { className: "v-title", meta: "500 · 28/1.2 · −0.025em", role: "title", sample: "Router grades" },
  {
    className: "v-heading",
    meta: "500 · 20/1.3 · −0.025em",
    role: "heading",
    sample: "Support triage",
  },
  {
    className: "v-heading-sm",
    meta: "500 · 16/1.35 · −0.025em",
    role: "heading-sm",
    sample: "Action items",
  },
  {
    className: "v-body",
    meta: "400 · 14/1.5 · 0",
    role: "body",
    sample: "38 tickets match, so the reply waits until a person reads it.",
  },
  {
    className: "v-body-sm",
    meta: "400 · 13/1.5 · 0",
    role: "body-sm",
    sample: "Sends from support@northfield.app and closes each ticket.",
  },
  { className: "v-label", meta: "500 · 13/1.35 · +0.02em", role: "label", sample: "Grade again" },
  {
    className: "v-label-sm",
    meta: "500 · 12/1.35 · +0.02em",
    role: "label-sm",
    sample: "Your call",
  },
  {
    className: "v-caption",
    meta: "400 · 12/1.35 · 0",
    role: "caption",
    sample: "Notes taken by the meeting agent",
  },
  { className: "v-code", monoPx: 14, role: "code", sample: "run_8f2c1a" },
  {
    className: "v-code-block",
    meta: "400 · 12/20 mono",
    role: "code-block",
    sample: '{ "ticket": 4471, "seats": 12 }',
  },
] as const;

/** The ten type roles, and why inline mono is scaled down. */
export const TypeFoundation = () => {
  const { monoScale } = useSettings();

  return (
    <>
      <div>
        {SCALE.map((row) => (
          <div className="v-type-row" key={row.role}>
            <span className="v-code-sm v-t2">{row.role}</span>
            <span className={`${row.className} v-type-sample`}>{row.sample}</span>
            <span className="v-type-meta">
              {"meta" in row ? row.meta : `400 · ${figure(row.monoPx * monoScale)}/1.5 mono`}
            </span>
          </div>
        ))}
      </div>
      <Minor>Mono scaled to the sentence</Minor>
      <div className="v-specimens">
        <div className="v-rule-side">
          <div className="v-stage">
            <p className="v-body-sm">
              Key <code>key_9f2c</code> was rotated at 09:12.
            </p>
          </div>
          <p className="v-caption v-t2">
            Scaled to {monoScale}, the key sits at the same visual size as its neighbouring words.
          </p>
        </div>
        <div className="v-rule-side">
          <div className="v-stage">
            <p className="v-body-sm">
              Key <span className="v-mono-full">key_9f2c</span> was rotated at 09:12.
            </p>
          </div>
          <p className="v-caption v-t2">
            Left at full size, the mono key looks a step larger and loosens the line.
          </p>
        </div>
      </div>
      <ul className="v-stack-sm v-body-sm v-bullets">
        <li>
          A heading outranks a sentence by being bigger, set a touch tighter and written in a
          heavier pen. Inside a sentence, 600 picks out a figure or two; it never builds a heading
          of its own.
        </li>
        <li>
          Every label is written the way it is said, in sentence case, from buttons to table heads.
          Nothing is set in capitals or spaced out.
        </li>
        <li>Figures line up with tabular numerals; mono is kept for strings a person pastes.</li>
      </ul>
    </>
  );
};
