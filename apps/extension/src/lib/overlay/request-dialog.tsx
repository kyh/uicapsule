import { useEffect, useEffectEvent, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";

export type FieldKey = "credit.name" | "credit.url" | "description" | "name";

export type Fields = Record<FieldKey, string>;

export type FieldErrors = Partial<Record<FieldKey, string>>;

/** How a picked video is coming along: being fetched, attached as a file, or only linked. */
export type VideoChip = { state: "attached" | "linked" | "working"; text: string } | null;

const MAC = navigator.userAgent.includes("Mac");

const focusOnMount = (input: HTMLInputElement | null) => {
  input?.focus();
};

const Field = ({ children, error }: { children: ReactNode; error?: string }) => (
  <label className="field" data-invalid={error === undefined ? undefined : ""}>
    {children}
    {error === undefined ? null : <span className="error">{error}</span>}
  </label>
);

/** The modal that opens once a capture is taken: the screenshot, the request fields, File. */
export const RequestDialog = ({
  busy,
  errors,
  initial,
  onCancel,
  onSubmit,
  problem,
  shot,
  target,
  video,
  where,
}: {
  busy: string | null;
  errors: FieldErrors;
  initial: Fields;
  onCancel: () => void;
  onSubmit: (fields: Fields) => void;
  problem: string | null;
  shot: { height: number; url: string; width: number };
  target: string;
  video: VideoChip;
  where: string;
}) => {
  const [fields, setFields] = useState(initial);

  const bind = (key: FieldKey) => ({
    onChange: (event: { currentTarget: { value: string } }) => {
      const { value } = event.currentTarget;
      setFields((current) => ({ ...current, [key]: value }));
    },
    value: fields[key],
  });

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      onSubmit(fields);
    } else if (event.key === "Escape") {
      onCancel();
    } else {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      onKey(event);
    };

    window.addEventListener("keydown", listener, { capture: true });

    return () => {
      window.removeEventListener("keydown", listener, { capture: true });
    };
  }, []);

  const submit = () => {
    onSubmit(fields);
  };

  return (
    <div>
      <div className="backdrop" />
      <dialog open aria-labelledby="uicapsule-title" className="dialog">
        <div className="dialog-head">
          <h2 className="dialog-title" id="uicapsule-title">
            Request a component
          </h2>
          <button
            aria-label="Back to the page"
            className="icon-btn"
            type="button"
            onClick={onCancel}
          >
            <X size={16} strokeWidth={1.8} />
          </button>
        </div>
        <div className="preview">
          <img alt="Captured area" className="shot" src={shot.url} />
          <span className="badge">
            {Math.round(shot.width)} × {Math.round(shot.height)}
          </span>
          {video ? (
            <span className="chip" data-state={video.state}>
              <span className="chip-dot" />
              <span>{video.text}</span>
            </span>
          ) : null}
        </div>
        <p className="where">{where}</p>
        <Field error={errors.name}>
          <input
            ref={focusOnMount}
            placeholder="Name it, like “Shutter button”"
            {...bind("name")}
          />
        </Field>
        <Field error={errors.description}>
          <textarea
            placeholder="What does it do? Describe what moves and what it responds to."
            rows={3}
            {...bind("description")}
          />
        </Field>
        <div className="row">
          <Field error={errors["credit.name"]}>
            <input
              autoComplete="name"
              placeholder="Credit name (optional)"
              {...bind("credit.name")}
            />
          </Field>
          <Field error={errors["credit.url"]}>
            <input placeholder="Credit link (optional)" type="url" {...bind("credit.url")} />
          </Field>
        </div>
        {problem === null ? null : (
          <p className="error" role="alert">
            {problem}
          </p>
        )}
        <div className="dialog-foot">
          <div className="leading">
            <span title={`Files a public GitHub issue through ${target}`}>
              Posted publicly on GitHub
            </span>
            <kbd>{MAC ? "⌘ ↵" : "Ctrl ↵"}</kbd>
          </div>
          <div className="buttons">
            <button className="btn" type="button" onClick={onCancel}>
              Back
            </button>
            <button
              className="btn"
              data-primary=""
              disabled={busy !== null}
              type="button"
              onClick={submit}
            >
              {busy ?? "File request"}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};
