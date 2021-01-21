import init, { store } from "./module";

window.__UI_CAPSULE_STORE__ = store;

window.addEventListener("DOMContentLoaded", () => {
  init(document.body);
  chrome.runtime.onMessage.addListener((action) => {
    store.dispatch(action);
  });
});
