export const ACTIVATE_APP = "ACTIVATE_APP";
export const DEACTIVATE_APP = "DEACTIVATE_APP";
export const TOGGLE_APP = "TOGGLE_APP";

const init = {
  enabled: false,
};

export default function reducer(state = init, action) {
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
    default:
      return state;
  }
}
