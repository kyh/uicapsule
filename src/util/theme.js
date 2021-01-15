import React, { useEffect } from "react";
import {
  createMuiTheme,
  ThemeProvider as MuiThemeProvider,
} from "@material-ui/core/styles";
import * as colors from "@material-ui/core/colors";
import CssBaseline from "@material-ui/core/CssBaseline";
import useDarkMode from "use-dark-mode";

const themeConfig = {
  // Light theme
  light: {
    palette: {
      type: "light",
      primary: {
        // Use hue from colors or hex
        main: colors.indigo["500"],
        // Uncomment to specify light/dark
        // shades instead of automatically
        // calculating from above value.
        //light: "#4791db",
        //dark: "#115293",
      },
      secondary: {
        main: colors.pink["500"],
      },
      background: {
        // Background for <body>
        // and <Section color="default">
        default: "#fff",
        // Background for elevated
        // components (<Card>, etc)
        paper: "#fff",
      },
    },
  },

  // Dark theme
  dark: {
    palette: {
      type: "dark",
      primary: {
        // Same as in light but we could
        // adjust color hue if needed
        main: colors.indigo["500"],
      },
      secondary: {
        main: colors.pink["500"],
      },
      background: {
        default: colors.grey["900"],
        paper: colors.grey["800"],
      },
    },
  },

  // Values for both themes
  common: {
    typography: {
      fontSize: 14,
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      // Uncomment to make button lowercase
      // button: { textTransform: "none" },
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1200,
        xl: 1920,
      },
    },
    // Override component styles
    overrides: {
      // Global styles
      MuiCssBaseline: {
        "@global": {
          "#__next": {
            // Flex column that is height
            // of viewport so that footer
            // can push self to bottom by
            // with auto margin-top
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            // Prevent child elements from
            // shrinking when content
            // is taller than the screen
            // (quirk of flex parent)
            "& > *": {
              flexShrink: 0,
            },
          },
        },
      },
    },
  },
};

function getTheme(name) {
  // Create MUI theme from themeConfig
  return createMuiTheme({
    ...themeConfig[name],
    // Merge in common values
    ...themeConfig.common,
    overrides: {
      // Merge overrides
      ...(themeConfig[name] && themeConfig[name].overrides),
      ...(themeConfig.common && themeConfig.common.overrides),
    },
  });
}

export const ThemeProvider = (props) => {
  // Detect dark mode based on stored value
  // with fallback to system setting
  const darkMode = useDarkMode();
  // Get MUI theme object
  const theme = getTheme(darkMode.value ? "dark" : "light");

  // Since Next.js server-renders we need to remove
  // the server-side injected CSS on mount so the
  // client can take over with managing styles.
  useEffect(() => {
    const jssStyles = document.querySelector("#jss-server-side");
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
  }, []);

  return (
    <MuiThemeProvider theme={theme}>
      {/* Set global MUI styles */}
      <CssBaseline />
      {props.children}
    </MuiThemeProvider>
  );
};
