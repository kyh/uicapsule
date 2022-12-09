import { responsiveVariables } from "utilities/helpers";
import * as T from "styles/types";
import s from "./height.module.css";

const getHeightStyles: T.DynamicStyleUtility<string> = (value) => {
	if (!value) return null;
	const variables = responsiveVariables("--_rs-h", value);

	return { classNames: s.root, variables };
};

export default getHeightStyles;
