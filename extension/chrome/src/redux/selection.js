export const highlightAttr = "data-ui-capsule-highlight";
export const selectedAttr = "data-ui-capsule-selected";

export const SELECT_ELEMENT = "SELECT_ELEMENT";
export const SELECTED_ELEMENT = "SELECTED_ELEMENT";
export const RESET_SELECTED_ELEMENT = "RESET_SELECTED_ELEMENT";

export function selectElement(element) {
  return {
    type: SELECT_ELEMENT,
    element,
  };
}

export function resetSelectedElement() {
  return {
    type: RESET_SELECTED_ELEMENT,
  };
}

const init = {
  loading: false,
  element: null,
  stringified: "",
};

export default function reducer(state = init, action) {
  switch (action.type) {
    case SELECT_ELEMENT:
      const computed = computeElement(action.element);
      return {
        ...state,
        element: action.element,
        stringified: computed,
      };
    case RESET_SELECTED_ELEMENT: {
      return {
        ...state,
        element: null,
        stringified: "",
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

// Alternative path is to use the `document.styleSheets` API
function computeElement(rootNode) {
  let index = 0;
  let styles = "";
  const clone = rootNode.cloneNode(true);
  const removed = removeAttributes(rootNode);

  walkDom(rootNode, clone, (node, cloneNode) => {
    index = index + 1;
    const className = `c-${index}`;
    const computedStyle = getComputedStyle(node);
    const css = Object.keys(computedStyle).reduce((result, styleKey) => {
      const styleValue = computedStyle[styleKey];
      if (!isNumber(styleKey) && styleValue) {
        result = result + `${camelToKebab(styleKey)}: ${styleValue};\n`;
      }
      return result;
    }, "");
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
