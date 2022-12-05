import { mount, store } from "./module";
let mounted = false;

const mountExtension = () => {
  if (!mounted) {
    mount(document.body);
    mounted = true;
  }
};

chrome.runtime.onMessage.addListener(async (action, _sender, sendResponse) => {
  mountExtension();
  if (action === "STATE") {
    sendResponse(store.getState());
  } else {
    store.dispatch(action);
  }
});
