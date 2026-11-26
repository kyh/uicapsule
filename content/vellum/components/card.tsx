import type { HTMLAttributes, ReactNode } from "react";

/** A card: the grey shell around one or more paper panels and an optional footer. */
export const Shell = ({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={`v-shell ${className}`} {...props} />
);

/** The paper panel, 3px inside its shell so the corners stay concentric. */
export const Panel = ({
  className = "",
  padded = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { padded?: boolean }) => (
  <div className={`v-panel ${padded ? "v-pad" : ""} ${className}`} {...props} />
);

/** The footer row on the shell: meta first, then flat secondaries, then one lead. */
export const ShellFoot = ({ meta, children }: { meta?: ReactNode; children?: ReactNode }) => (
  <div className="v-shell-foot">
    <span className="v-foot-meta v-caption">{meta}</span>
    {Boolean(children) && <span className="v-foot-actions">{children}</span>}
  </div>
);
