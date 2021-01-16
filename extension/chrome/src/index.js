import store from "./reducers/store";
import App from "./components/App";

window.__UI_CAPSULE_STORE__ = store;

window.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.onMessage.addListener((request) => {
    store.dispatch(request.action);
  });

  const host = document.createElement("div");
  document.body.insertAdjacentElement("beforebegin", host);

  store.attach(App, host);
});
