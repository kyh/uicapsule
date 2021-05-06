export const highlightAttr = "data-ui-capsule-highlight";
export const selectedAttr = "data-ui-capsule-selected";

let styleRules = [];
let loaded = false;

export const loadDocumentStyles = async () => {
  if (loaded) return;
  for (const sheet of document.styleSheets) {
    if (sheet.href) {
      await addLink(sheet.href);
    } else {
      if (
        sheet.ownerNode &&
        sheet.ownerNode.nodeName &&
        sheet.ownerNode.nodeName === "STYLE" &&
        sheet.ownerNode.firstChild
      ) {
        addCSS(sheet.ownerNode.firstChild.textContent);
      }
    }
  }
  loaded = true;
};

export const resetDocumentStyles = () => {
  loaded = false;
  styleRules = [];
};

const addLink = (url) => {
  return fetch(url)
    .then((res) => res.text())
    .then((text) => addCSS(text))
    .catch(console.error);
};

const addCSS = (text) => {
  const copySheet = document.createElement("style");
  copySheet.textContent = text;
  document.head.appendChild(copySheet);
  for (const rule of copySheet.sheet.cssRules) {
    if (rule.selectorText) {
      styleRules.push(rule);
    }
  }
  document.head.removeChild(copySheet);
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

const getStylesForElement = (el) => {
  return styleRules
    .filter((rule) => el.matches(rule.selectorText))
    .map((rule) => rule.style.cssText);
};

export const createISnippet = async (rootNode) => {
  await loadDocumentStyles();

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
    [...cloneNode.attributes].forEach((attr) =>
      cloneNode.removeAttribute(attr.name)
    );
    cloneNode.setAttribute("class", className);
  });

  removed.forEach((attr) => rootNode.setAttribute(attr, ""));

  return {
    html: clone.outerHTML,
    css: styles,
  };
};

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

export const constructSnippet = ({ html, css }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <meta http-equiv="X-UA-Compatible" content="ie=edge"/>
      <title>Document</title>
      <style>${css}</style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;
};
