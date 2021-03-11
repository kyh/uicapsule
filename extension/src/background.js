import firebase from "./util/firebase";
import { toggleApp, setUser } from "./redux/app";
import { SELECT_ELEMENT } from "./redux/selection";

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

const toggleActivationMessage = (tabId) => {
  const user = firebase.auth().currentUser;
  chrome.tabs.sendMessage(tabId, toggleApp(user && user.toJSON()), () =>
    updateExtensionUI(tabId)
  );
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

const signin = (token) => {
  if (!token) return;
  chrome.storage.sync.set({ token: token });
  return firebase
    .auth()
    .signInWithCustomToken(token)
    .catch((error) => {
      console.log("token signin error:", error);
    });
};

const signout = () => {
  chrome.storage.sync.remove(["token"]);
  return firebase.auth().signOut();
};

firebase.auth().onAuthStateChanged((user) => {
  console.log("user state change detected:", user);
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, setUser(user.toJSON()));
    });
  });
});

chrome.browserAction.onClicked.addListener(async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    toggleActivationMessage(tab.id);
  });
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  updateExtensionUI(tabId);
});

chrome.tabs.onUpdated.addListener(async ({ tabId }) => {
  updateExtensionUI(tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("new message", message);
  switch (message.type) {
    // case CAPTURE_SCREENSHOT:
    //   chrome.tabs.captureVisibleTab({ format: "png" }, sendResponse);
    //   break;
    case SELECT_ELEMENT:
      // Save to backend
      break;
  }
  return true;
});

const NEW_TOKEN = "NEW_TOKEN";
const REMOVE_TOKEN = "REMOVE_TOKEN";

chrome.runtime.onMessageExternal.addListener(
  (message, _sender, sendResponse) => {
    console.log("new external message", message);
    switch (message.type) {
      case NEW_TOKEN:
        signin(message.token);
        break;
      case REMOVE_TOKEN:
        signout();
        break;
      default:
        break;
    }
    return true;
  }
);

chrome.storage.sync.get(["token"], (result) => {
  console.log("getting token from storage...", result);
  signin(result.token);
});
