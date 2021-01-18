import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { applyMiddleware, createStore } from "redux";
import logger from "redux-logger";
import thunk from "redux-thunk";
import { Provider } from "react-redux";
import App from "./components/App";
import reducer from "./redux";

const middlewares = [
  thunk,
  process.env.NODE_ENV !== "production" && logger,
].filter(Boolean);
const store = createStore(reducer, applyMiddleware(...middlewares));
window.__UI_CAPSULE_STORE__ = store;

window.addEventListener("DOMContentLoaded", () => {
  const host = document.createElement("div");
  host.setAttribute("data-ui-capsule", "");
  document.head.insertAdjacentElement("beforebegin", host);

  chrome.runtime.onMessage.addListener((action) => {
    store.dispatch(action);
  });

  store.subscribe(() => {
    const state = store.getState();
    if (state.app.enabled) {
      render(
        <Provider store={store}>
          <App />
        </Provider>,
        host
      );
    } else {
      unmountComponentAtNode(host);
    }
  });
});
