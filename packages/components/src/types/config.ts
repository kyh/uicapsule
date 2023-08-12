import { PartialUserThemeDefinition } from "cli/theming/tokens/types";

export type UICConfig = {
  themes?: Record<string, PartialUserThemeDefinition>;
  themeFragments?: Record<string, PartialUserThemeDefinition>;
  themeOptions?: {
    generateOnColorsFor?: string[];
  };
};
