import { PartialUserThemeDefinition } from "cli/theming/tokens/types";

export type UICapsuleConfig = {
  themes?: Record<string, PartialUserThemeDefinition>;
  themeFragments?: Record<string, PartialUserThemeDefinition>;
};
