import React, { useEffect } from "react";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import {
  createMuiTheme,
  StylesProvider,
  ThemeProvider as MuiThemeProvider,
} from "@material-ui/core/styles";
import * as colors from "@material-ui/core/colors";
import CssBaseline from "@material-ui/core/CssBaseline";
// import useDarkMode from "use-dark-mode";

const themeConfig = {
  // Light theme
  light: {
    palette: {
      type: "light",
      primary: {
        main: "#0070f4",
      },
      secondary: {
        main: "#1F2937",
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
        main: "#0070f4",
      },
      secondary: {
        main: "#1F2937",
      },
      background: {
        default: colors.grey["900"],
        paper: colors.grey["900"],
      },
    },
  },

  // Values for both themes
  common: {
    typography: {
      fontSize: 14,
      fontFamily: "Inter, sans-serif",
      button: { textTransform: "none" },
      h1: {
        fontWeight: 800,
        fontSize: "3.75rem",
        lineHeight: "1",
      },
      h2: {
        fontWeight: 800,
        fontSize: "2.25rem",
        lineHeight: "2.5rem",
      },
      h3: {
        fontWeight: 800,
        fontSize: "1.5rem",
        lineHeight: "2rem",
      },
      h4: {
        fontWeight: 800,
        fontSize: "1.25rem",
        lineHeight: "1.75rem",
      },
      h5: {
        fontWeight: 600,
        fontSize: "1rem",
        lineHeight: "1.5rem",
      },
      h6: {
        fontWeight: 600,
        fontSize: "0.875rem",
        lineHeight: "1.25rem",
      },
    },
    shadows: [
      "none",
      "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
      "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
      "0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      "0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      "0 20px 25px -5px rgba(0, 0, 0, 0.04), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    ],
    // Override component styles
    overrides: {
      MuiCssBaseline: {
        "@global": {
          "#__next": {
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            "& > *": {
              flexShrink: 0,
            },
          },
        },
      },
      MuiCircularProgress: {
        root: {
          animationDuration: "550ms !important",
        },
      },
      MuiFormHelperText: {
        contained: {
          marginTop: 4,
          lineHeight: 1.4,
          marginLeft: 0,
          marginRight: 0,
        },
      },
      MuiOutlinedInput: {
        root: {
          "& $notchedOutline": {
            borderWidth: 2,
            borderColor: "#3b475f1a",
          },
          "&:hover:not($disabled):not($focused):not($error) $notchedOutline": {
            borderColor: "#3b475f1a",
          },
        },
      },
      MuiBackdrop: {
        root: {
          backgroundColor: "rgba(59, 71, 95, 0.85)",
        },
      },
    },
    props: {
      MuiButton: {
        disableElevation: true,
      },
    },
  },
};

const getTheme = (name) =>
  createMuiTheme({
    ...themeConfig[name],
    // Merge in common values
    ...themeConfig.common,
    overrides: {
      // Merge overrides
      ...(themeConfig[name] && themeConfig[name].overrides),
      ...(themeConfig.common && themeConfig.common.overrides),
    },
  });

export const ThemeProvider = (props) => {
  // Detect dark mode based on stored value
  // with fallback to system setting
  // const darkMode = useDarkMode();
  // Get MUI theme object
  // const theme = getTheme(darkMode.value ? "dark" : "light");
  const theme = getTheme("light");

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
    <StylesProvider injectFirst>
      <MuiThemeProvider theme={theme}>
        <StyledThemeProvider theme={theme}>
          <CssBaseline />
          {props.children}
        </StyledThemeProvider>
      </MuiThemeProvider>
    </StylesProvider>
  );
};
