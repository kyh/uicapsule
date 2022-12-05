import definition from "src/theming/definitions/ui";
import { UICapsuleConfig } from "types/config";

const config: UICapsuleConfig = {
  themes: {
    uicapsule: definition,
  },

  themeFragments: {
    twitter: {
      color: {
        backgroundPrimary: { hex: "#1da1f2" },
        backgroundPrimaryHighlighted: { hex: "#1a90da" },
      },
    },
  },
};

export default config;
