import { responsiveVariables } from "utilities/helpers";
import * as T from "styles/types";
import s from "./maxHeight.module.css";

const getMaxHeightStyles: T.DynamicStyleUtility<string> = (value) => {
	if (!value) return null;
	const variables = responsiveVariables("--_rs-mh", value);

	return { classNames: s.root, variables };
};

export default getMaxHeightStyles;
