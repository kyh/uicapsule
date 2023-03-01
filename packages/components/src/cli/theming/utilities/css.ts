import { camelToKebab } from "./string";
import type * as T from "../tokens/types";

export const getVariableName = (
  tokenName: string,
  tokenType?: string,
  options?: { scoped?: boolean; viewport?: string }
) => {
  const value = [
    "uic",
    tokenType && camelToKebab(tokenType),
    camelToKebab(tokenName),
    options?.viewport,
  ]
    .filter(Boolean)
    .join("-");

  return `--${value}`;
};

export const createVariable = (token: T.TransformedToken) => {
  const variableName = getVariableName(token.name, token.tokenType, {
    viewport: token.viewport,
  });

  return `${variableName}: ${token.value};`;
};

export const createMedia = (token: T.TransformedToken) =>
  `@custom-media ${getVariableName(token.name, token.tokenType)} ${
    token.value
  };`;

export const variablesTemplate = (
  themeName: string,
  tokens: T.TransformedToken[]
) => {
  const filteredTokens: Record<
    "root" | "light" | "dark",
    T.TransformedToken[]
  > = {
    root: [],
    light: [],
    dark: [],
  };

  tokens.forEach((token) => {
    if (token.mode === "light") filteredTokens.light.push(token);
    if (token.mode === "dark") filteredTokens.dark.push(token);
    if (!token.mode) filteredTokens.root.push(token);
  });

  let code = "";

  Object.entries(filteredTokens).forEach(([type, tokens]) => {
    const selector =
      type === "root"
        ? `[data-uic-theme="${themeName}-light"], [data-uic-theme="${themeName}-dark"]`
        : `[data-uic-theme="${themeName}-${type}"]`;

    code += `
			${selector} {
					${tokens.map((token) => createVariable(token)).join("\n")}
					${type === "dark" || type === "light" ? `color-scheme: ${type};` : ""}
			}
		`;
  });

  return code;
};

export const mediaTemplate = (tokens: T.TransformedToken[]) => `
	${tokens.map((token) => createMedia(token)).join("\n")}
`;
