import React from "react";
import * as T from "./Properties.types";

const Context = React.createContext<T.ProviderProps["properties"]>({});

export const useProperties = () => React.useContext(Context);

const PropertiesProvider = (props: T.ProviderProps) => {
	const { properties, children } = props;

	return <Context.Provider value={properties}>{children}</Context.Provider>;
};

export default PropertiesProvider;
