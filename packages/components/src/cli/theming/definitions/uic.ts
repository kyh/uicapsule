import { UserThemeDefinition } from "../tokens/types";

const theme: UserThemeDefinition = {
  fontFamily: {
    display: {
      family:
        "BlinkMacSystemFont, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    },
    body: {
      family:
        "BlinkMacSystemFont, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    },
  },

  fontWeight: {
    regular: { weight: 400 },
    medium: { weight: 500 },
    bold: { weight: 700 },
    heavy: { weight: 800 },
    black: { weight: 900 },
  },

  font: {
    display1: {
      fontSize: { px: 40 },
      lineHeight: { px: 48 },
      fontWeightToken: "medium",
      fontFamilyToken: "display",
      responsive: {
        m: {
          fontSize: { px: 64 },
          lineHeight: { px: 76 },
        },
        l: {
          fontSize: { px: 84 },
          lineHeight: { px: 96 },
        },
        xl: {
          fontSize: { px: 96 },
          lineHeight: { px: 112 },
        },
      },
    },
    display2: {
      fontSize: { px: 36 },
      lineHeight: { px: 44 },
      fontWeightToken: "medium",
      fontFamilyToken: "display",
      responsive: {
        m: {
          fontSize: { px: 48 },
          lineHeight: { px: 56 },
        },
        l: {
          fontSize: { px: 56 },
          lineHeight: { px: 64 },
        },
        xl: {
          fontSize: { px: 64 },
          lineHeight: { px: 72 },
        },
      },
    },
    display3: {
      fontSize: { px: 32 },
      lineHeight: { px: 36 },
      fontWeightToken: "medium",
      fontFamilyToken: "display",
      responsive: {
        m: {
          fontSize: { px: 36 },
          lineHeight: { px: 48 },
        },
        l: {
          fontSize: { px: 44 },
          lineHeight: { px: 52 },
        },
        xl: {
          fontSize: { px: 48 },
          lineHeight: { px: 56 },
        },
      },
    },
    title1: {
      fontSize: { px: 24 },
      lineHeight: { px: 32 },
      fontWeightToken: "medium",
      fontFamilyToken: "body",
      responsive: {
        l: {
          fontSize: { px: 32 },
          lineHeight: { px: 40 },
        },
      },
    },
    title2: {
      fontSize: { px: 20 },
      lineHeight: { px: 28 },
      fontWeightToken: "medium",
      fontFamilyToken: "body",
      responsive: {
        l: {
          fontSize: { px: 24 },
          lineHeight: { px: 32 },
        },
      },
    },
    title3: {
      fontSize: { px: 18 },
      lineHeight: { px: 24 },
      fontWeightToken: "medium",
      fontFamilyToken: "body",
      responsive: {
        l: {
          fontSize: { px: 20 },
          lineHeight: { px: 28 },
        },
      },
    },
    featured1: {
      fontSize: { px: 24 },
      lineHeight: { px: 32 },
      fontWeightToken: "regular",
      fontFamilyToken: "display",
      responsive: {
        l: {
          fontSize: { px: 32 },
          lineHeight: { px: 40 },
        },
      },
    },
    featured2: {
      fontSize: { px: 20 },
      lineHeight: { px: 28 },
      fontWeightToken: "regular",
      fontFamilyToken: "display",
      responsive: {
        l: {
          fontSize: { px: 24 },
          lineHeight: { px: 32 },
        },
      },
    },
    featured3: {
      fontSize: { px: 18 },
      lineHeight: { px: 24 },
      fontWeightToken: "regular",
      fontFamilyToken: "display",
      responsive: {
        l: {
          fontSize: { px: 20 },
          lineHeight: { px: 28 },
        },
      },
    },
    bodyStrong1: {
      fontSize: { px: 16 },
      lineHeight: { px: 24 },
      fontWeightToken: "bold",
      fontFamilyToken: "body",
    },
    bodyMedium1: {
      fontSize: { px: 16 },
      lineHeight: { px: 24 },
      fontWeightToken: "medium",
      fontFamilyToken: "body",
    },
    body1: {
      fontSize: { px: 16 },
      lineHeight: { px: 24 },
      fontWeightToken: "regular",
      fontFamilyToken: "body",
    },
    bodyStrong2: {
      fontSize: { px: 14 },
      lineHeight: { px: 20 },
      fontWeightToken: "bold",
      fontFamilyToken: "body",
    },
    bodyMedium2: {
      fontSize: { px: 14 },
      lineHeight: { px: 20 },
      fontWeightToken: "medium",
      fontFamilyToken: "body",
    },
    body2: {
      fontSize: { px: 14 },
      lineHeight: { px: 20 },
      fontWeightToken: "regular",
      fontFamilyToken: "body",
    },
    caption1: {
      fontSize: { px: 12 },
      lineHeight: { px: 16 },
      fontWeightToken: "regular",
      fontFamilyToken: "body",
    },
    caption2: {
      fontSize: { px: 10 },
      lineHeight: { px: 16 },
      fontWeightToken: "bold",
      fontFamilyToken: "body",
    },
  },

  unit: {
    base: { px: 4 },
    radiusSmall: { px: 4 },
    radiusMedium: { px: 8 },
    radiusLarge: { px: 12 },
  },

  color: {
    foregroundNeutral: { hex: "#14171F", hexDark: "#EFF0F1" },
    foregroundNeutralFaded: { hex: "#3C455D", hexDark: "#C1C7D7" },
    foregroundDisabled: { hex: "#C7CDDB", hexDark: "#404A63" },
    foregroundPrimary: { hex: "#14171F", hexDark: "#EFF0F1" },
    foregroundPositive: { hex: "#05751F", hexDark: "#03AB5F" },
    foregroundCritical: { hex: "#CB101D", hexDark: "#EB6666" },

    backgroundNeutral: { hex: "#DFE2EA", hexDark: "#30374A" },
    backgroundNeutralFaded: { hex: "#F4F5F7", hexDark: "#242938" },
    backgroundNeutralHighlighted: { hex: "#C7CDDB", hexDark: "#404A63" },
    backgroundDisabled: { hex: "#EBEDF2", hexDark: "#282E3E" },
    backgroundDisabledFaded: { hex: "#F4F5F7", hexDark: "#242938" },
    backgroundPrimary: { hex: "#14171F", hexDark: "#EFF0F1" },
    backgroundPrimaryFaded: { hex: "#F4F5F7", hexDark: "#242938" },
    backgroundPrimaryHighlighted: { hex: "#3C455D", hexDark: "#FDFDFD" },
    backgroundPositive: { hex: "#078549" },
    backgroundPositiveFaded: { hex: "#ddf3e4", hexDark: "#153226" },
    backgroundPositiveHighlighted: { hex: "#009950" },
    backgroundCritical: { hex: "#DA0000" },
    backgroundCriticalFaded: { hex: "#FDE7E9", hexDark: "#460C0C" },
    backgroundCriticalHighlighted: { hex: "#E93535" },

    borderNeutral: { hex: "#BBC1D3", hexDark: "#49536F" },
    borderNeutralFaded: { hex: "#DFE2EA", hexDark: "#30374A" },
    borderDisabled: { hex: "#DFE2EA", hexDark: "#30374A" },
    borderPrimary: { hex: "#14171F", hexDark: "#49536F" },
    borderPrimaryFaded: { hex: "#DFE2EA", hexDark: "#30374A" },
    borderPositive: { hex: "#05751F", hexDark: "#03AB5F" },
    borderPositiveFaded: { hex: "#CDEDD5", hexDark: "#034A2A" },
    borderCritical: { hex: "#CB101D", hexDark: "#EB6666" },
    borderCriticalFaded: { hex: "#FBD0D4", hexDark: "#6A1C1C" },

    backgroundPage: { hex: "#FFFFFF", hexDark: "#0D1117" },
    backgroundPageFaded: { hex: "#F8F8F8", hexDark: "#11171F" },
    backgroundBase: { hex: "#FFFFFF", hexDark: "#181C25" },
    backgroundElevated: { hex: "#FFFFFF", hexDark: "#1C212B" },

    black: { hex: "#000000" },
    white: { hex: "#FFFFFF" },
  },

  duration: {
    fast: { ms: 150 },
    medium: { ms: 250 },
    slow: { ms: 300 },
  },

  easing: {
    standard: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 },
    accelerate: { x1: 0.4, y1: 0, x2: 1, y2: 1 },
    decelerate: { x1: 0, y1: 0, x2: 0.2, y2: 1 },
  },

  shadow: {
    base: [
      {
        offsetX: 0,
        offsetY: 2,
        blurRadius: 4,
        colorToken: "black",
        opacity: 0.12,
      },
    ],
    elevated: [
      {
        offsetX: 0,
        offsetY: 15,
        blurRadius: 25,
        colorToken: "black",
        opacity: 0.07,
      },
      {
        offsetX: 0,
        offsetY: 5,
        blurRadius: 10,
        colorToken: "black",
        opacity: 0.05,
      },
    ],
  },
};

export default theme;
