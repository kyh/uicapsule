import { cx } from "../lib/cx";
import { formatAmount, spokenAmount } from "../lib/format";

import "./figure.css";

interface FigureProps {
  value: number;
  as?: "p" | "output" | "span";
  align?: "start" | "center";
  size?: "display" | "large";
  live?: boolean;
  className?: string;
}

/** A display amount with its cents lifted and set at half size, so the dollars read first. */
export const Figure = ({
  value,
  as = "p",
  align = "start",
  size = "display",
  live = false,
  className,
}: FigureProps) => {
  const text = formatAmount(value);
  const dot = text.lastIndexOf(".");
  const whole = dot === -1 ? text : text.slice(0, dot);
  const cents = dot === -1 ? "" : text.slice(dot + 1);

  const content = (
    <>
      <span className="cl-sr">{spokenAmount(value)}</span>
      <span aria-hidden className="cl-fig__whole">
        {whole}
      </span>
      {cents ? (
        <span aria-hidden className="cl-fig__cents">
          {cents}
        </span>
      ) : null}
    </>
  );

  const props = {
    "aria-live": live ? ("polite" as const) : undefined,
    className: cx("cl-fig", className),
    "data-align": align,
    "data-size": size,
  };

  if (as === "output") {
    return <output {...props}>{content}</output>;
  }

  if (as === "span") {
    return <span {...props}>{content}</span>;
  }

  return <p {...props}>{content}</p>;
};
