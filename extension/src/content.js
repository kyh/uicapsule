import { mount, store } from "./module";

mount(document.body);

chrome.runtime.onMessage.addListener(async (action, _sender, sendResponse) => {
  if (action === "STATE") {
    sendResponse(store.getState());
  } else {
    store.dispatch(action);
  }
});
