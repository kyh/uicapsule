import { responsiveVariables } from "utilities/helpers";
import * as T from "styles/types";
import s from "./width.module.css";

const getWidthStyles: T.DynamicStyleUtility<string> = (value) => {
  if (!value) return null;
  const variables = responsiveVariables("--_uic-w", value);

  return { classNames: s.root, variables };
};

export default getWidthStyles;
