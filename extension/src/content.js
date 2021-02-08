import { mount, store } from "./module";

window.__UI_CAPSULE_STORE__ = store;

mount(document.body);

chrome.runtime.onMessage.addListener(async (action, _sender, sendResponse) => {
  if (action === "STATE") {
    sendResponse(store.getState());
  } else {
    store.dispatch(action);
  }
});
