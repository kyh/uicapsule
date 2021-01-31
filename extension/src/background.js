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

function setIcon(path) {
  chrome.browserAction.setIcon({ path });
}

function showEnabled() {
  setIcon(ACTIVITY.on);
}

function showDisabled() {
  setIcon(ACTIVITY.off);
}

function sendActivationMessage(tabId) {
  chrome.tabs.sendMessage(tabId, activateApp(), showEnabled);
}

function sendDeactivationMessage(tabId) {
  chrome.tabs.sendMessage(tabId, deactivateApp(), showDisabled);
}

function toggleActivationMessage(tabId) {
  chrome.tabs.sendMessage(tabId, toggleApp(), () => updateExtensionUI(tabId));
}

function getActivationStatus(tabId, cb) {
  chrome.tabs.executeScript(
    tabId,
    {
      code: "!!window.__UI_CAPSULE_STORE__.getState().app.enabled",
    },
    ([enabled]) => cb(enabled)
  );
}

function updateExtensionUI(tabId) {
  getActivationStatus(tabId, (enabled) => {
    if (enabled) {
      showEnabled();
    } else {
      showDisabled();
    }
  });
}

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case CAPTURE_SCREENSHOT:
      chrome.tabs.captureVisibleTab({ format: "png" }, sendResponse);
      break;
    default:
      break;
  }
  return true;
});
