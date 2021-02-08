import { activateApp, deactivateApp, toggleApp } from "./redux/app";
import { CAPTURE_SCREENSHOT } from "./redux/selection";
const ACTIVATE_MENU_ID = "ACTIVATE";
const DEACTIVATE_MENU_ID = "DEACTIVATE";

const ACTIVITY = {
  on: {
    64: "public/logo-highlight-64.png",
    128: "public/logo-highlight-128.png",
    256: "public/logo-highlight-256.png",
    512: "public/logo-highlight-512.png",
  },
  off: {
    64: "public/logo-gray-64.png",
    128: "public/logo-gray-128.png",
    256: "public/logo-gray-256.png",
    512: "public/logo-gray-512.png",
  },
};

const setIcon = (path) => {
  chrome.browserAction.setIcon({ path });
};

const showEnabled = () => {
  setIcon(ACTIVITY.on);
};

const showDisabled = () => {
  setIcon(ACTIVITY.off);
};

const show = (tabId) => {
  chrome.tabs.sendMessage(tabId, "STATE", (state) => {
    if (state) {
      state.app.enabled ? showEnabled() : showDisabled();
    } else {
      showDisabled();
    }
  });
};

const sendActivationMessage = (tabId) => {
  chrome.tabs.sendMessage(tabId, activateApp(), showEnabled);
};

const sendDeactivationMessage = (tabId) => {
  chrome.tabs.sendMessage(tabId, deactivateApp(), showDisabled);
};

const toggleActivationMessage = (tabId) => {
  chrome.tabs.sendMessage(tabId, toggleApp(), () => updateExtensionUI(tabId));
};

const updateExtensionUI = (tabId) => {
  if (tabId) {
    show(tabId);
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      show(tab.id);
    });
  }
};

chrome.browserAction.onClicked.addListener(async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    toggleActivationMessage(tab.id);
  });
});

chrome.contextMenus.create({
  id: ACTIVATE_MENU_ID,
  title: "Enable",
  contexts: ["all"],
  type: "normal",
  documentUrlPatterns: ["*://*/*"],
  onclick: (info, tab) => {
    if (info.menuItemId !== ACTIVATE_MENU_ID) return;
    sendActivationMessage(tab.id);
  },
});

chrome.contextMenus.create({
  id: DEACTIVATE_MENU_ID,
  title: "Disable",
  contexts: ["all"],
  type: "normal",
  documentUrlPatterns: ["*://*/*"],
  onclick: (info, tab) => {
    if (info.menuItemId !== DEACTIVATE_MENU_ID) return;
    sendDeactivationMessage(tab.id);
  },
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  updateExtensionUI(tabId);
});

chrome.tabs.onUpdated.addListener(async ({ tabId }) => {
  updateExtensionUI(tabId);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {
    case CAPTURE_SCREENSHOT:
      chrome.tabs.captureVisibleTab({ format: "png" }, sendResponse);
      break;
    default:
      break;
  }
  return true;
});
