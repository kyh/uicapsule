import { responsiveVariables } from "utilities/helpers";
import * as T from "styles/types";
import s from "./maxWidth.module.css";

const getMaxWidthStyles: T.DynamicStyleUtility<string> = (value) => {
  if (!value) return null;
  const variables = responsiveVariables("--_uic-mw", value);

  return { classNames: s.root, variables };
};

export default getMaxWidthStyles;
