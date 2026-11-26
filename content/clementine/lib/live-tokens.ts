import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

export type TokenValues = Record<Theme, ReadonlyMap<string, string>>;

let cached: TokenValues | null = null;
let cachedFor = "";

const probe = (theme: Theme, names: readonly string[]) => {
  const node = document.createElement("div");
  node.className = "ds-clementine";
  node.dataset.theme = theme;
  node.hidden = true;
  document.body.append(node);
  const style = getComputedStyle(node);
  const values = new Map(names.map((name) => [name, style.getPropertyValue(name).trim()]));
  node.remove();

  return values;
};

const read = (names: readonly string[]) => {
  const key = names.join(",");

  if (cached && cachedFor === key) {
    return cached;
  }

  const light = probe("light", names);

  if ([...light.values()].every((value) => value === "")) {
    return null;
  }

  cached = { dark: probe("dark", names), light };
  cachedFor = key;

  return cached;
};

/** Reads custom properties from tokens.css for both themes, so foundations never copy a value by hand. */
export const useLiveTokens = (names: readonly string[]) => {
  const [tokens, setTokens] = useState<TokenValues | null>(null);
  const key = names.join(",");

  useEffect(() => {
    const list = key.split(",");
    const update = () => setTokens(read(list));

    update();
    window.addEventListener("load", update);

    return () => window.removeEventListener("load", update);
  }, [key]);

  return tokens;
};
