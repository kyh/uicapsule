import { useCallback, useState } from "react";
import type { ReactNode } from "react";

const Tip = ({ label, shortcut }: { label: string; shortcut?: string }) => (
  <span className="uic-tip" role="tooltip">
    {label}
    {shortcut === undefined ? null : <kbd>{shortcut}</kbd>}
  </span>
);

/** The floating bar at the bottom of the page. Hosts compose it from groups, tools and actions. */
export const InspectBar = ({ children, label }: { children: ReactNode; label: string }) => (
  <div aria-label={label} className="uic-bar uic-chrome" role="toolbar">
    {children}
  </div>
);

/** A run of tools that belong together, like the capture tools or the annotate tools. */
export const ToolGroup = ({ children, label }: { children: ReactNode; label: string }) => (
  <fieldset aria-label={label} className="uic-group">
    {children}
  </fieldset>
);

export const BarDivider = () => <span aria-hidden className="uic-divider" />;

/** An icon button with its name and shortcut in a tooltip; `pressed` marks the active tool. */
export const ToolButton = ({
  disabled,
  icon,
  label,
  onPress,
  pressed,
  shortcut,
}: {
  disabled?: boolean;
  icon: ReactNode;
  label: string;
  onPress: () => void;
  pressed?: boolean;
  shortcut?: string;
}) => (
  <button
    aria-label={shortcut === undefined ? label : `${label} (${shortcut})`}
    aria-pressed={pressed}
    className="uic-tool"
    disabled={disabled}
    type="button"
    onClick={onPress}
  >
    {icon}
    <Tip label={label} shortcut={shortcut} />
  </button>
);

/** One choice in a `ToolSwitch`. */
export interface SwitchOption<T extends string> {
  icon: ReactNode;
  label: string;
  shortcut?: string;
  value: T;
}

/** A segmented switch between tool groups; a pill slides under the chosen one. */
export const ToolSwitch = <T extends string>({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: T) => void;
  options: SwitchOption<T>[];
  value: T;
}) => {
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  return (
    <fieldset aria-label={label} className="uic-switch">
      <span aria-hidden className="uic-switch-pill" style={{ translate: `${index * 30}px 0` }} />
      {options.map((option) => (
        <button
          key={option.value}
          aria-label={
            option.shortcut === undefined ? option.label : `${option.label} (${option.shortcut})`
          }
          aria-pressed={option.value === value}
          className="uic-switch-option"
          type="button"
          onClick={() => {
            onChange(option.value);
          }}
        >
          {option.icon}
          <Tip label={option.label} shortcut={option.shortcut} />
        </button>
      ))}
    </fieldset>
  );
};

/** One group of tools in a `ToolStage`. */
export interface StagePanel<T extends string> {
  content: ReactNode;
  value: T;
}

/**
 * Shows one panel of tools at a time. Every panel stays mounted side by side on a track; the
 * stage resizes to the open panel and the track slides it into view, so switching groups glides
 * instead of jumping. The stage clips only while it slides, so tooltips can overhang it at rest.
 */
export const ToolStage = <T extends string>({
  open,
  panels,
}: {
  open: T;
  panels: StagePanel<T>[];
}) => {
  const [widths, setWidths] = useState<number[]>([]);
  const [shown, setShown] = useState(open);
  const [moving, setMoving] = useState(false);

  if (shown !== open) {
    setShown(open);
    setMoving(true);
  }

  const observeTrack = useCallback((track: HTMLDivElement) => {
    const measure = () => {
      setWidths([...track.children].map((panel) => panel.getBoundingClientRect().width));
    };

    const observer = new ResizeObserver(measure);

    for (const panel of track.children) {
      observer.observe(panel);
    }

    measure();

    return () => {
      observer.disconnect();
    };
  }, []);

  const index = panels.findIndex((panel) => panel.value === open);
  const offset = widths.slice(0, index).reduce((sum, width) => sum + width, 0);
  const width = widths[index];

  return (
    <div
      className="uic-stage"
      data-moving={moving ? "" : undefined}
      data-ready={width === undefined ? undefined : ""}
      style={width === undefined ? undefined : { width }}
    >
      <div
        ref={observeTrack}
        className="uic-track"
        style={{ translate: `${-offset}px 0` }}
        onTransitionEnd={(event) => {
          if (event.target === event.currentTarget) {
            setMoving(false);
          }
        }}
      >
        {panels.map((panel) => (
          <div
            key={panel.value}
            className="uic-panel"
            data-open={panel.value === open ? "" : undefined}
            inert={panel.value !== open}
          >
            {panel.content}
          </div>
        ))}
      </div>
    </div>
  );
};
