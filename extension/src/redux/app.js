export const ACTIVATE_APP = "ACTIVATE_APP";
export const DEACTIVATE_APP = "DEACTIVATE_APP";
export const TOGGLE_APP = "TOGGLE_APP";
export const TOGGLE_THEME = "TOGGLE_THEME";

export const activateApp = () => ({
  type: ACTIVATE_APP,
});

export const deactivateApp = () => ({
  type: DEACTIVATE_APP,
});

export const toggleApp = () => ({
  type: TOGGLE_APP,
});

export const toggleTheme = (darkMode) => {
  darkMode = !darkMode;
  window.localStorage.setItem("color-mode", darkMode ? "dark" : "light");
  return {
    type: TOGGLE_THEME,
    darkMode,
  };
};

const isDarkMode = () => {
  if (window) {
    return (
      window.localStorage.getItem("color-mode") === "dark" ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches &&
        !window.localStorage.getItem("color-mode"))
    );
  }
  return false;
};

const init = {
  enabled: false,
  darkMode: isDarkMode(),
};

const reducer = (state = init, action) => {
  switch (action.type) {
    case TOGGLE_APP:
      if (!state.enabled) {
        return {
          ...state,
          enabled: true,
        };
      } else {
        return {
          ...state,
          enabled: false,
        };
      }
    case ACTIVATE_APP: {
      return {
        ...state,
        enabled: true,
      };
    }
    case DEACTIVATE_APP: {
      return {
        ...state,
        enabled: false,
      };
    }
    case TOGGLE_THEME: {
      return {
        ...state,
        darkMode: action.darkMode,
      };
    }
    default:
      return state;
  }
};

export default reducer;
