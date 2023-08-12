import uicapsuleDefinition from "cli/theming/definitions/uicapsule";
import figmaDefinition from "cli/theming/definitions/figma";
import slateDefinition from "cli/theming/definitions/slate";
import { UICConfig } from "types/config";

const config: UICConfig = {
  themes: {
    uicapsule: uicapsuleDefinition,
    figma: figmaDefinition,
    slate: slateDefinition,
  },

  themeFragments: {
    twitter: {
      color: {
        backgroundPrimary: { hex: "#1da1f2" },
        backgroundPrimaryHighlighted: { hex: "#1a90da" },
      },
    },
  },

  themeOptions: {},
};

export default config;
