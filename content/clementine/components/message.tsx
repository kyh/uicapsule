import type { ReactNode } from "react";

import "./message.css";

export const Message = ({
  from,
  name = "Clementine",
  children,
}: {
  from: "person" | "assistant";
  name?: string;
  children: ReactNode;
}) => (
  <div className="cl-msg" data-from={from}>
    <span className="cl-sr">{from === "person" ? "You" : name}: </span>
    <div className="cl-msg__body">{children}</div>
  </div>
);
