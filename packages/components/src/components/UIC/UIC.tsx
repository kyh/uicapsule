import React from "react";
import { classNames } from "utilities/helpers";
import ThemeProvider, { GlobalColorMode } from "components/Theme";
import { ToastProvider } from "components/Toast";
import useKeyboardModeGlobal from "./hooks/useKeyboardModeGlobal";
import useRTLGlobal, { RTLContext } from "./hooks/useRTLGlobal";
import type * as T from "./UIC.types";
import "./UIC.css";
import s from "./UIC.module.css";

export const IdContext = React.createContext({ current: 0 });

const UICInner = (props: T.Props) => {
  const { children, defaultRTL, toastOptions } = props;
  const idRef = React.useRef(0);
  const rtlState = useRTLGlobal(defaultRTL);

  useKeyboardModeGlobal();

  return (
    <IdContext.Provider value={idRef}>
      <RTLContext.Provider value={rtlState}>
        <ToastProvider options={toastOptions}>{children}</ToastProvider>
      </RTLContext.Provider>
    </IdContext.Provider>
  );
};

const UIC = (props: T.Props) => {
  const { theme = "uicapsule", defaultColorMode, className } = props;
  const rootClassNames = classNames(s.root, className);

  return (
    <GlobalColorMode defaultMode={defaultColorMode}>
      <ThemeProvider theme={theme} className={rootClassNames}>
        <UICInner {...props}>{props.children}</UICInner>
      </ThemeProvider>
    </GlobalColorMode>
  );
};

export default UIC;
