import React from "react";

type Props = {
  w?: string | number;
  h?: string | number;
  children?: React.ReactNode;
  inverted?: boolean;
};

const Placeholder = (props: Props) => {
  const { w = "auto", h = 50, children } = props;

  return (
    <div
      style={{
        width: w,
        height: h,
        minWidth: h,
        padding: "var(--uic-unit-x2)",
        background: "var(--uic-color-foreground-neutral)",
        opacity: 0.1,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--uic-unit-radius-small)",
      }}
    >
      {children}
    </div>
  );
};

export default Placeholder;
