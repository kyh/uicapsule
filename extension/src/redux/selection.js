import { toPng } from "html-to-image";

export const highlightAttr = "data-ui-capsule-highlight";
export const selectedAttr = "data-ui-capsule-selected";

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
  const { htmlString, dataUrl } = await compileElement(element, apiMode);

  const item = {
    title: `[${location.hostname}] Component`,
    html: htmlString,
    image: dataUrl,
    description: "Added with extension",
    tags: "",
  };

  chrome.runtime.sendMessage({ type: SELECT_ELEMENT, item }, (response) => {
    dispatch({
      type: SELECT_ELEMENT_SUCCESS,
      item: response,
    });
  });
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
  const htmlString = convertToHtmlString(element);
  const dataUrl = await toPng(element);
  removed.forEach((attr) => element.setAttribute(attr, ""));
  return { htmlString, dataUrl };
};

export const ELEMENT_PARSER_VERSION = 1;

const convertToHtmlString = (rootNode) => {
  const clone = rootNode.cloneNode(true);
  let styles = `
    body {
      margin: 0;
      padding: 0;
    }
  `;
  let index = 0;

  walkDom(rootNode, clone, (node, cloneNode) => {
    index = index + 1;
    const className = `c-${index}`;
    const css = reduceComputedStyles(
      getComputedStyle(node),
      (styleKey, styleValue) => !isNumber(styleKey) && styleValue
    );
    styles =
      styles +
      `
      .${className} {
        ${css}
      }
    `;
    cloneNode.setAttribute("class", className);
    cloneNode.removeAttribute("href");
  });

  return `
    <style>
      ${styles}
    </style>
    ${clone.outerHTML}
  `;
};

const walkDom = (el, cl, callback) => {
  callback(el, cl);
  el = el.firstElementChild;
  cl = cl.firstElementChild;
  while (el && cl) {
    walkDom(el, cl, callback);
    el = el.nextElementSibling;
    cl = cl.nextElementSibling;
  }
};

const camelToKebab = (string) =>
  string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();

const isNumber = (num) => {
  if (typeof num === "number") {
    return num - num === 0;
  }
  if (typeof num === "string" && num.trim() !== "") {
    return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
  }
  return false;
};

const reduceComputedStyles = (computedStyle, filter) =>
  Object.keys(computedStyle).reduce((result, styleKey) => {
    const styleValue = computedStyle[styleKey];
    if (filter(styleKey, styleValue)) {
      result = result + `${camelToKebab(styleKey)}: ${styleValue};\n`;
    }
    return result;
  }, "");

export const removeAttributes = (el) => {
  const removed = [];
  if (el.hasAttribute(highlightAttr)) {
    el.removeAttribute(highlightAttr);
    removed.push(highlightAttr);
  }
  if (el.hasAttribute(selectedAttr)) {
    el.removeAttribute(selectedAttr);
    removed.push(selectedAttr);
  }
  return removed;
};

const computeRootStyles = (rootNode) => {
  const rootComputedStyles = getComputedStyle(rootNode.parentNode);
  const rootCss = reduceComputedStyles(
    rootComputedStyles,
    (styleKey, styleValue) => !isNumber(styleKey) && styleValue
  );
  return { rootCss, rootComputedStyles };
};

const convertToHtmlString2 = (rootNode) => {
  const clone = rootNode.cloneNode(true);
  const removed = removeAttributes(rootNode);
  const { rootCss, rootComputedStyles } = computeRootStyles(rootNode);
  const parentStyleCache = {
    "c-1": rootComputedStyles,
  };
  let styles = `
    body {
      ${rootCss}
      margin: 0;
      padding: 0;
    }
  `;
  let index = 0;

  walkDom(rootNode, clone, (node, cloneNode) => {
    index = index + 1;
    const className = `c-${index}`;
    if (!parentStyleCache[className]) {
      parentStyleCache[className] = getComputedStyle(node.parentNode);
    }
    const computedStyle = getComputedStyle(node);
    const css = reduceComputedStyles(
      computedStyle,
      (styleKey, styleValue) =>
        !isNumber(styleKey) &&
        styleValue &&
        styleValue !== parentStyleCache[className][styleKey]
    );
    styles =
      styles +
      `
      .${className} {
        ${css}
      }
    `;
    cloneNode.setAttribute("class", className);
    cloneNode.removeAttribute("href");
  });

  removed.forEach((attr) => rootNode.setAttribute(attr, ""));

  return `
    <style>
      ${styles}
    </style>
    ${clone.outerHTML}
  `;
};
