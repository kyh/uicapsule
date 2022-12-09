import React from "react";
import * as G from "types/global";

/**
 * Utility controlled only with classnames
 */
export type StaticStyleUtility<Value> = (value?: G.Responsive<Value>) => null | {
	classNames: G.ClassName;
};

/**
 * Utility controlled with classNames and css variables
 * Classnames define the styles, variables define the values for those styles
 */
export type DynamicStyleUtility<Value> = (value?: G.Responsive<Value>) => null | {
	classNames: G.ClassName;
	variables: React.CSSProperties;
};
