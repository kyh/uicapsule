import { responsiveClassNames } from "utilities/helpers";
import * as T from "styles/types";
import s from "./radius.module.css";

const getRadiusStyles: T.StaticStyleUtility<"small" | "medium" | "large" | "circular"> = (
	value
) => {
	if (!value) return null;
	const classNames = responsiveClassNames(s, "--radius", value);

	return { classNames };
};

export default getRadiusStyles;
