import firebase from "./util/firebase";
import { toggleApp, setUser } from "./redux/app";
import { SELECT_ELEMENT, DELETE_ELEMENT } from "./redux/selection";

const firestore = firebase.firestore();
const serverTimestamp = firebase.firestore.FieldValue.serverTimestamp;

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

const toggleIconState = (tabId) => {
  chrome.tabs.sendMessage(tabId, "STATE", (state) => {
    if (state) {
      state.app.enabled ? setIcon(ACTIVITY.on) : setIcon(ACTIVITY.off);
    } else {
      setIcon(ACTIVITY.off);
    }
  });
};

const updateExtensionUI = (tabId) => {
  tabId
    ? toggleIconState(tabId)
    : chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        toggleIconState(tab.id);
      });
};

const toggleExtension = (tabId) => {
  const user = firebase.auth().currentUser;
  chrome.tabs.sendMessage(tabId, toggleApp(user && user.toJSON()), () =>
    updateExtensionUI(tabId)
  );
};

const signin = (token) => {
  if (!token) return;
  return firebase
    .auth()
    .signInWithCustomToken(token)
    .then(() => chrome.storage.sync.set({ token: token }))
    .catch((error) => {
      chrome.storage.sync.remove(["token"]);
      console.log("token signin error:", error);
    });
};

const signout = () => {
  return firebase
    .auth()
    .signOut()
    .then(() => chrome.storage.sync.remove(["token"]))
    .catch((error) => {
      console.log("token signout error:", error);
    });
};

const createItem = async (data) => {
  const user = firebase.auth().currentUser;
  const response = await firestore.collection("items").add({
    ...data,
    owner: user.uid,
    createdAt: serverTimestamp(),
  });
  return { id: response.id, ...data };
};

const deleteItem = (item) =>
  firestore.collection("items").doc(item.id).delete();

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
    toggleExtension(tab.id);
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
    case SELECT_ELEMENT:
      createItem(message.item).then(sendResponse);
      break;
    case DELETE_ELEMENT:
      deleteItem(message.item).then(sendResponse);
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
