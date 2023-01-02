import React from "react";
import type * as T from "./Tabs.types";

const Context = React.createContext<T.Context>({
  value: undefined,
  name: undefined,
  onChange: () => {},
  setDefaultValue: () => {},
  id: "",
});

export const TabsProvider = Context.Provider;

export const useTabs = (value?: string) => {
  const { id, ...data } = React.useContext(Context);

  return {
    ...data,
    panelId: value !== undefined ? `${id}-tabs-panel-${value}` : undefined,
    buttonId: value !== undefined ? `${id}-tabs-button-${value}` : undefined,
  };
};
