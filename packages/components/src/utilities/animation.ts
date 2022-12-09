export const onNextFrame = (cb: () => void) => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => cb());
  });
};

const transitionAttribute = "data-uicapsule-no-transition";

export const disableTransitions = () => {
  document.body.setAttribute(transitionAttribute, "true");
};

export const enableTransitions = () => {
  document.body.removeAttribute(transitionAttribute);
};

export const checkTransitions = () => {
  return !document.body.hasAttribute(transitionAttribute);
};
