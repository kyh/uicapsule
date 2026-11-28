import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

const TOAST_MS = 6000;
const LEAVE_MS = 200;

export interface ToastData {
  link?: { href: string; label: string };
  text?: string;
  title: string;
  tone?: "error";
}

type Stage = "hovered" | "leaving" | "resting" | "shown";

const DELAYS = {
  hovered: undefined,
  leaving: LEAVE_MS,
  resting: TOAST_MS / 2,
  shown: TOAST_MS,
} satisfies Record<Stage, number | undefined>;

/** One toast in the corner. It leaves on its own (paused while hovered), then calls `onGone`. */
export const Toast = ({ onGone, toast }: { onGone: () => void; toast: ToastData }) => {
  const [stage, setStage] = useState<Stage>("shown");
  const delay = DELAYS[stage];

  useEffect(() => {
    const timer =
      delay === undefined
        ? undefined
        : setTimeout(() => {
            if (stage === "leaving") {
              onGone();
            } else {
              setStage("leaving");
            }
          }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [delay, onGone, stage]);

  return (
    <output
      className="toast"
      data-leaving={stage === "leaving" ? "" : undefined}
      data-tone={toast.tone}
      onPointerEnter={() => {
        setStage((current) => (current === "leaving" ? current : "hovered"));
      }}
      onPointerLeave={() => {
        setStage((current) => (current === "leaving" ? current : "resting"));
      }}
    >
      <span className="toast-icon">
        {toast.tone === "error" ? "!" : <Check strokeWidth={2.4} />}
      </span>
      <span className="toast-body">
        <span className="toast-title">{toast.title}</span>
        {toast.text === undefined || toast.text === "" ? null : (
          <span className="toast-text">{toast.text}</span>
        )}
      </span>
      {toast.link ? (
        <a href={toast.link.href} rel="noreferrer" target="_blank">
          {toast.link.label}
        </a>
      ) : null}
      <button
        aria-label="Dismiss"
        className="icon-btn"
        type="button"
        onClick={() => {
          setStage("leaving");
        }}
      >
        <X size={16} strokeWidth={1.8} />
      </button>
    </output>
  );
};
