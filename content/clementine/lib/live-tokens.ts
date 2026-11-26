import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark";

export type TokenValues = Record<Theme, ReadonlyMap<string, string>>;

export type TokenVars = Readonly<Record<`--${string}`, string>>;

/** Inline custom properties the page root sets per theme, so foundations read the tuned values. */
export const TokenOverrides = createContext<Readonly<Record<Theme, TokenVars>>>({
  dark: {},
  light: {},
});

let cached: TokenValues | null = null;
let cachedFor = "";

const probe = (theme: Theme, names: readonly string[], vars: TokenVars) => {
  const node = document.createElement("div");
  node.className = "ds-clementine";
  node.dataset.theme = theme;
  node.hidden = true;

  for (const [name, value] of Object.entries(vars)) {
    node.style.setProperty(name, value);
  }

  document.body.append(node);
  const style = getComputedStyle(node);
  const values = new Map(names.map((name) => [name, style.getPropertyValue(name).trim()]));
  node.remove();

  return values;
};

const read = (names: readonly string[], overrides: Readonly<Record<Theme, TokenVars>>) => {
  const key = JSON.stringify([names, overrides]);

  if (cached && cachedFor === key) {
    return cached;
  }

  const light = probe("light", names, overrides.light);

  if ([...light.values()].every((value) => value === "")) {
    return null;
  }

  cached = { dark: probe("dark", names, overrides.dark), light };
  cachedFor = key;

  return cached;
};

/** Reads custom properties from tokens.css for both themes, so foundations never copy a value by hand. */
export const useLiveTokens = (names: readonly string[]) => {
  const [tokens, setTokens] = useState<TokenValues | null>(null);
  const overrides = useContext(TokenOverrides);
  const key = names.join(",");

  useEffect(() => {
    const list = key.split(",");

    const update = () => {
      setTokens(read(list, overrides));
    };

    update();
    window.addEventListener("load", update);

    return () => {
      window.removeEventListener("load", update);
    };
  }, [key, overrides]);

  return tokens;
};
