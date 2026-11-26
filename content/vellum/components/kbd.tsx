import type { ReactNode } from "react";

/** A key on the keyboard. */
export const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="v-kbd">{children}</kbd>
);
