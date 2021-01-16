import {
  ACTIVATE_APP,
  DEACTIVATE_APP,
  TOGGLE_APP,
} from "./reducers/appReducer";
import "crx-hotreload";

const ACTIVATE_MENU_ID = "ACTIVATE";
const DEACTIVATE_MENU_ID = "DEACTIVATE";

const INACTIVE = "#8B8B8B";
const ACTIVE = "#21AF0D";

function setBadge(text, color) {
  chrome.browserAction.setBadgeText({ text });
  chrome.browserAction.setBadgeBackgroundColor({ color });
}

function showEnabled() {
  setBadge("On", ACTIVE);
}

function showDisabled() {
  setBadge("Off", INACTIVE);
}

function sendActivationMessage(tabId) {
  chrome.tabs.sendMessage(tabId, { type: ACTIVATE_APP });
  showEnabled();
}

function toggleActivationMessage(tabId, cb) {
  chrome.tabs.sendMessage(tabId, { type: TOGGLE_APP }, () => {
    cb();
  });
}

function sendDeactivationMessage(tabId) {
  chrome.tabs.sendMessage(tabId, { type: DEACTIVATE_APP });
  showDisabled();
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

chrome.browserAction.onClicked.addListener((tab) => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    toggleActivationMessage(tabs[0].id, handleTabChange.bind(null, tabs[0].id));
  });
});

chrome.contextMenus.create({
  id: ACTIVATE_MENU_ID,
  title: "Enable",
  contexts: ["all"],
  type: "normal",
  documentUrlPatterns: ["*://*/*"],
  onclick: function (info, tab) {
    if (info.menuItemId !== ACTIVATE_MENU_ID) {
      return;
    }
    sendActivationMessage(tab.id);
  },
});

chrome.contextMenus.create({
  id: DEACTIVATE_MENU_ID,
  title: "Disable",
  contexts: ["all"],
  type: "normal",
  documentUrlPatterns: ["*://*/*"],
  onclick: function (info, tab) {
    if (info.menuItemId !== DEACTIVATE_MENU_ID) {
      return;
    }
    sendDeactivationMessage(tab.id);
  },
});

chrome.tabs.onActivated.addListener(({ id }) => {
  handleTabChange(id);
});

chrome.tabs.onUpdated.addListener(({ id }) => {
  handleTabChange(id);
});
