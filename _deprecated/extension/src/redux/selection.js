import { toPng } from "html-to-image";
import { createISnippet, removeAttributes } from "../util/parser";

export const SELECT_ELEMENT = "SELECT_ELEMENT";
export const SELECT_ELEMENT_SUCCESS = "SELECT_ELEMENT_SUCCESS";
export const RESET_SELECTED_ELEMENT = "RESET_SELECTED_ELEMENT";
export const DELETE_ELEMENT = "DELETE_ELEMENT";

export const LOADING_STATE = {
  default: "default",
  loading: "loading",
  deleting: "deleting",
  done: "done",
};

export const selectElement = (element, apiMode) => async (dispatch) => {
  dispatch({
    type: SELECT_ELEMENT,
    element,
  });

  const { iSnippet, previewImage } = await compileElement(element, apiMode);

  const item = {
    title: `[${location.hostname}] Component`,
    iSnippet: iSnippet,
    // previewImage: previewImage,
    description: "Added with extension",
    tags: "",
  };

  if (!apiMode) {
    chrome.runtime.sendMessage({ type: SELECT_ELEMENT, item }, (response) => {
      dispatch({
        type: SELECT_ELEMENT_SUCCESS,
        item: response,
      });
    });
  } else {
    dispatch({
      type: SELECT_ELEMENT_SUCCESS,
      item: { id: "id", ...item },
    });
  }
};

export const deleteElement = (item) => async (dispatch) => {
  chrome.runtime.sendMessage({ type: DELETE_ELEMENT, item }, () => {
    dispatch({ type: RESET_SELECTED_ELEMENT });
  });
};

export const resetSelectedElement = () => ({
  type: RESET_SELECTED_ELEMENT,
});

const init = {
  loadingState: LOADING_STATE.default,
  element: null,
  item: {},
};

const reducer = (state = init, action) => {
  switch (action.type) {
    case SELECT_ELEMENT:
      return {
        ...state,
        element: action.element,
        loadingState: LOADING_STATE.loading,
      };
    case SELECT_ELEMENT_SUCCESS:
      return {
        ...state,
        item: action.item,
        loadingState: LOADING_STATE.done,
      };
    case DELETE_ELEMENT:
      return {
        ...state,
        loadingState: LOADING_STATE.deleting,
      };
    case RESET_SELECTED_ELEMENT: {
      return {
        ...init,
      };
    }
    default:
      return state;
  }
};

export default reducer;

const captureScreenshot = (element) =>
  new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "CAPTURE_SCREENSHOT" }, (dataUri) => {
      const rect = element.getBoundingClientRect();
      const img = new Image();
      img.src = dataUri;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const context = canvas.getContext("2d");
        context.drawImage(
          img,
          rect.x,
          rect.y,
          rect.width,
          rect.height,
          0,
          0,
          img.width,
          img.height
        );
        const croppedUri = canvas.toDataURL("image/png");
        // You could deal with croppedUri as cropped image src.
        resolve(croppedUri);
      };
    });
  });

const compileElement = async (element, apiMode) => {
  const removed = removeAttributes(element);
  const iSnippet = await createISnippet(element);
  const previewImage = await toPng(element);
  removed.forEach((attr) => element.setAttribute(attr, ""));
  return { iSnippet, previewImage };
};

export * from "../util/parser";
