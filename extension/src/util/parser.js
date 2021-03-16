export const highlightAttr = "data-ui-capsule-highlight";
export const selectedAttr = "data-ui-capsule-selected";

const availailableStyles = {
  alignContent: true,
  alignItems: true,
  alignSelf: true,
  animation: true,
  appearance: true,
  aspectRatio: true,
  backdropFilter: true,
  backfaceVisibility: true,
  background: true,
  borderBottom: true,
  borderLeft: true,
  borderRight: true,
  borderTop: true,
  bottom: true,
  boxShadow: true,
  color: true,
  content: true,
  cursor: true,
  display: true,
  fill: true,
  fillOpacity: true,
  fillRule: true,
  flexBasis: true,
  flexDirection: true,
  flexFlow: true,
  flexGrow: true,
  flexShrink: true,
  flexWrap: true,
  float: true,
  font: true,
  fontWeight: true,
  grid: true,
  gridArea: true,
  gridAutoColumns: true,
  gridAutoFlow: true,
  gridAutoRows: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnGap: true,
  gridColumnStart: true,
  gridGap: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowGap: true,
  gridRowStart: true,
  gridTemplate: true,
  gridTemplateAreas: true,
  gridTemplateColumns: true,
  gridTemplateRows: true,
  height: true,
  justifyContent: true,
  justifyItems: true,
  justifySelf: true,
  left: true,
  letterSpacing: true,
  margin: true,
  maxHeight: true,
  maxWidth: true,
  minHeight: true,
  minWidth: true,
  objectFit: true,
  opacity: true,
  outline: true,
  overflowX: true,
  overflowY: true,
  padding: true,
  perspective: true,
  perspectiveOrigin: true,
  pointerEvents: true,
  position: true,
  textAlign: true,
  textDecoration: true,
  textIndent: true,
  textOverflow: true,
  textShadow: true,
  textTransform: true,
  top: true,
  transform: true,
  transformOrigin: true,
  transition: true,
  verticalAlign: true,
  visibility: true,
  whiteSpace: true,
};

const inheritableStyles = {
  color: true,
  cursor: true,
  font: true,
  letterSpacing: true,
  textAlign: true,
  textTransform: true,
  visibility: true,
  whiteSpace: true,
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
    (styleKey, styleValue) => availailableStyles[styleKey] && styleValue
  );
  return { rootCss, rootComputedStyles };
};

// Deprecated
export const __convertToHtmlString = (rootNode) => {
  const clone = rootNode.cloneNode(true);
  const removed = removeAttributes(rootNode);
  const { rootCss, rootComputedStyles } = computeRootStyles(rootNode);
  const styleCache = {
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
    if (!styleCache[className]) {
      styleCache[className] = getComputedStyle(node.parentNode);
    }
    const computedStyle = getComputedStyle(node);
    const css = reduceComputedStyles(computedStyle, (styleKey, styleValue) => {
      // only accept certain styles and filter out styles with no values
      if (availailableStyles[styleKey] && styleValue) {
        // if the style is inheritable, don't apply the style if its the same
        // as its parent
        if (inheritableStyles[styleKey]) {
          return styleValue !== styleCache[className][styleKey];
        } else {
          return true;
        }
      }
      return false;
    });
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

const getStylesForElement = (el) => {
  const ret = [];
  [...document.styleSheets].forEach((ss) => {
    if (ss.href) return;
    const rules = ss.rules || ss.cssRules;
    [...rules].forEach((rule) => {
      if (el.matches(rule.selectorText)) {
        ret.push(rule.style.cssText);
      }
    });
  });
  return ret;
};

export const convertToHtmlString = (rootNode) => {
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
    const css = getStylesForElement(node).join("\n");
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
