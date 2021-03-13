export const extensionID = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID;
export const NEW_TOKEN = "NEW_TOKEN";
export const REMOVE_TOKEN = "REMOVE_TOKEN";

export const sendNewToken = (token) => {
  if (chrome) {
    chrome.runtime.sendMessage(extensionID, {
      type: NEW_TOKEN,
      token,
    });
  }
};

export const sendRemoveToken = () => {
  if (chrome) {
    chrome.runtime.sendMessage(extensionID, {
      type: REMOVE_TOKEN,
    });
  }
};
