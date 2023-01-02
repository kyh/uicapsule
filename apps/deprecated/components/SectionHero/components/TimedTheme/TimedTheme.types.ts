import React from "react";

export type Props = {
  themeIndex: number | null;
  themes: string[];
  onThemeChange: (themeIndex: number) => void;
  children?: React.ReactNode;
};
