import React from "react";
import { classNames } from "utilities/helpers";
import ThemeProvider, { GlobalColorMode } from "components/Theme";
import { ToastProvider } from "components/Toast";
import useSingletonKeyboardMode from "hooks/_private/useSingletonKeyboardMode";
import useRTLGlobal, {
  SingletonRTLContext,
} from "hooks/_private/useSingletonRTL";
import { SingletonHotkeysProvider } from "hooks/_private/useSingletonHotkeys";
import type * as T from "./UICapsule.types";
import "./UICapsule.css";
import s from "./UICapsule.module.css";

export const IdContext = React.createContext({ current: 0 });

const UICapsuleInner = (props: T.Props) => {
  const { children, defaultRTL, toastOptions } = props;
  const idRef = React.useRef(0);
  const rtlState = useRTLGlobal(defaultRTL);

  useSingletonKeyboardMode();

  return (
    <IdContext.Provider value={idRef}>
      <SingletonRTLContext.Provider value={rtlState}>
        <SingletonHotkeysProvider>
          <ToastProvider options={toastOptions}>{children}</ToastProvider>
        </SingletonHotkeysProvider>
      </SingletonRTLContext.Provider>
    </IdContext.Provider>
  );
};

const UICapsule = (props: T.Props) => {
  const { theme = "uicapsule", defaultColorMode, className } = props;
  const rootClassNames = classNames(s.root, className);

  return (
    <GlobalColorMode defaultMode={defaultColorMode}>
      <ThemeProvider theme={theme} className={rootClassNames}>
        <UICapsuleInner {...props}>{props.children}</UICapsuleInner>
      </ThemeProvider>
    </GlobalColorMode>
  );
};

export default UICapsule;
