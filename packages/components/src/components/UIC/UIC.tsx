"use client";

import React from "react";
import { classNames } from "utilities/helpers";
import Theme, { GlobalColorMode } from "components/Theme";
import { ToastProvider } from "components/Toast";
import useSingletonKeyboardMode from "hooks/_private/useSingletonKeyboardMode";
import {
  SingletonEnvironmentContext,
  useSingletonRTL,
} from "hooks/_private/useSingletonEnvironment";
import { SingletonHotkeysProvider } from "hooks/_private/useSingletonHotkeys";
import type * as T from "./UIC.types";
import "./UIC.css";
import s from "./UIC.module.css";

const UICInner = (props: T.Props) => {
  const { children, defaultRTL, defaultViewport = "s", toastOptions } = props;
  const rtlState = useSingletonRTL(defaultRTL);

  useSingletonKeyboardMode();

  return (
    <SingletonEnvironmentContext.Provider
      value={{ rtl: rtlState, defaultViewport }}
    >
      <SingletonHotkeysProvider>
        <ToastProvider options={toastOptions}>{children}</ToastProvider>
      </SingletonHotkeysProvider>
    </SingletonEnvironmentContext.Provider>
  );
};

const UIC = (props: T.Props) => {
  const {
    theme,
    defaultTheme = "uicapsule",
    defaultColorMode,
    className,
  } = props;
  const rootClassNames = classNames(s.root, className);

  return (
    <GlobalColorMode defaultMode={defaultColorMode}>
      <Theme name={theme} defaultName={defaultTheme} className={rootClassNames}>
        <UICInner {...props}>{props.children}</UICInner>
      </Theme>
    </GlobalColorMode>
  );
};

export default UIC;
