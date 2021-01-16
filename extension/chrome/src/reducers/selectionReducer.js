export const SELECT_ELEMENT = "SELECT_ELEMENT";
export const RESET_SELECTED_ELEMENT = "RESET_SELECTED_ELEMENT";

const init = {
  selectedElement: null,
};

export default function reducer(state = init, action, args) {
  switch (action) {
    case SELECT_ELEMENT:
      return {
        ...state,
        selectedElement: args.element,
      };
    case RESET_SELECTED_ELEMENT: {
      return {
        ...state,
        selectedElement: null,
      };
    }
    default:
      return state;
  }
}
