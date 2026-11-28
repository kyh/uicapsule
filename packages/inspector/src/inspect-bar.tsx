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

/** The bar's one labelled button: what the host does with the selection. */
export const BarAction = ({
  children,
  disabled,
  icon,
  onPress,
  shortcut,
  tip,
}: {
  children: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  onPress: () => void;
  shortcut?: string;
  tip: string;
}) => (
  <button className="uic-action" disabled={disabled} type="button" onClick={onPress}>
    {icon}
    {children}
    <Tip label={tip} shortcut={shortcut} />
  </button>
);
