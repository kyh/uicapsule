import { activateApp, deactivateApp, toggleApp } from "./redux/app";
import "crx-hotreload";

const ACTIVATE_MENU_ID = "ACTIVATE";
const DEACTIVATE_MENU_ID = "DEACTIVATE";

const ACTIVITY = {
  on: {
    64: "public/icons/logo-highlight-64.png",
    128: "public/icons/logo-highlight-128.png",
    256: "public/icons/logo-highlight-256.png",
    512: "public/icons/logo-highlight-512.png",
  },
  off: {
    64: "public/icons/logo-gray-64.png",
    128: "public/icons/logo-gray-128.png",
    256: "public/icons/logo-gray-256.png",
    512: "public/icons/logo-gray-512.png",
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
  chrome.tabs.sendMessage(tabId, activateApp());
  showEnabled();
}

function sendDeactivationMessage(tabId) {
  chrome.tabs.sendMessage(tabId, deactivateApp());
  showDisabled();
}

function toggleActivationMessage(tabId, cb) {
  chrome.tabs.sendMessage(tabId, toggleApp(), () => {
    cb();
  });
}

function getActivationStatus(tabId, cb) {
  chrome.tabs.executeScript(
    tabId,
    {
      code: "!!window.__UI_CAPSULE_STORE__.getState().app.enabled",
    },
    (result) => cb(result)
  );
}

function handleTabChange(tabId) {
  getActivationStatus(tabId, (result) => {
    if (!result) {
      showDisabled();
      return;
    }
    if (result[0]) {
      showEnabled();
    } else {
      showDisabled();
    }
  });
}

chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    toggleActivationMessage(tabs[0].id, () => handleTabChange(tabs[0].id));
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

chrome.tabs.onActivated.addListener(({ id }) => {
  handleTabChange(id);
});

chrome.tabs.onUpdated.addListener(({ id }) => {
  handleTabChange(id);
});
