export const highlightAttr = "data-ui-capsule-highlight";
export const selectedAttr = "data-ui-capsule-selected";

export const SELECT_ELEMENT = "SELECT_ELEMENT";
export const SELECT_ELEMENT_DONE = "SELECT_ELEMENT_DONE";
export const RESET_SELECTED_ELEMENT = "RESET_SELECTED_ELEMENT";

export const LOADING_STATE = {
  default: "default",
  loading: "loading",
  done: "done",
};

export function selectElement(element) {
  return (dispatch) => {
    return new Promise((resolve) => {
      dispatch({
        type: SELECT_ELEMENT,
        element,
      });
      const computed = parseElement(element);
      setTimeout(() => {
        dispatch({
          type: SELECT_ELEMENT_DONE,
          stringified: computed,
        });
        resolve();
      }, 2000);
    });
  };
}

export function resetSelectedElement() {
  return {
    type: RESET_SELECTED_ELEMENT,
  };
}

const init = {
  loadingState: LOADING_STATE.default,
  element: null,
  stringified: "",
};

export default function reducer(state = init, action) {
  switch (action.type) {
    case SELECT_ELEMENT:
      return {
        ...state,
        element: action.element,
        loadingState: LOADING_STATE.loading,
      };
    case SELECT_ELEMENT_DONE:
      return {
        ...state,
        stringified: action.stringified,
        loadingState: LOADING_STATE.done,
      };
    case RESET_SELECTED_ELEMENT: {
      return {
        ...init,
      };
    }
    default:
      return state;
  }
}

export function removeAttributes(el) {
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
}

export const ELEMENT_PARSER_VERSION = 1;

function parseElement(rootNode) {
  const clone = rootNode.cloneNode(true);
  const removed = removeAttributes(rootNode);
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

  removed.forEach((attr) => rootNode.setAttribute(attr, ""));

  return `
    <style>
      ${styles}
    </style>
    ${clone.outerHTML}
  `;
}

function walkDom(el, cl, callback) {
  callback(el, cl);
  el = el.firstElementChild;
  cl = cl.firstElementChild;
  while (el && cl) {
    walkDom(el, cl, callback);
    el = el.nextElementSibling;
    cl = cl.nextElementSibling;
  }
}

function camelToKebab(string) {
  return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, "$1-$2").toLowerCase();
}

function isNumber(num) {
  if (typeof num === "number") {
    return num - num === 0;
  }
  if (typeof num === "string" && num.trim() !== "") {
    return Number.isFinite ? Number.isFinite(+num) : isFinite(+num);
  }
  return false;
}

function reduceComputedStyles(computedStyle, filter) {
  return Object.keys(computedStyle).reduce((result, styleKey) => {
    const styleValue = computedStyle[styleKey];
    if (filter(styleKey, styleValue)) {
      result = result + `${camelToKebab(styleKey)}: ${styleValue};\n`;
    }
    return result;
  }, "");
}

function computeRootStyles(rootNode) {
  const rootComputedStyles = getComputedStyle(rootNode.parentNode);
  const rootCss = reduceComputedStyles(
    rootComputedStyles,
    (styleKey, styleValue) => !isNumber(styleKey) && styleValue
  );
  return { rootCss, rootComputedStyles };
}

function parseElement2(rootNode) {
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
}
