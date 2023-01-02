import { createContext, useContext } from "react";
import * as T from "./Properties.types";

const Context = createContext<T.ProviderProps["properties"]>({});

export const useProperties = () => useContext(Context);

const PropertiesProvider = (props: T.ProviderProps) => {
  const { properties, children } = props;

  return <Context.Provider value={properties}>{children}</Context.Provider>;
};

export default PropertiesProvider;
