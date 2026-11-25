import { Sparkline } from "./sparkline";

import "./insight.css";

export const Insight = ({
  title,
  figure,
  basis,
  points,
  action,
  onAction,
  status,
}: {
  title: string;
  figure: string;
  basis?: string;
  points: readonly number[];
  action?: string;
  onAction?: () => void;
  status?: string;
}) => (
  <div className="cl-insight">
    <div className="cl-insight__text">
      <p className="cl-insight__title">{title}</p>
      <p className="cl-insight__figure">
        <span>{figure}</span>
        {basis ? <span className="cl-insight__basis">{basis}</span> : null}
      </p>
    </div>
    <div className="cl-insight__side">
      <Sparkline points={points} />
      {action ? (
        <button className="cl-link" onClick={onAction} type="button">
          {action}
        </button>
      ) : null}
    </div>
    {status ? <p className="cl-insight__status">{status}</p> : null}
  </div>
);
