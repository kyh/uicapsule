import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { applyMiddleware, createStore } from "redux";
import logger from "redux-logger";
import thunk from "redux-thunk";
import { Provider } from "react-redux";
import reducers from "./redux/reducers";
import { activateApp, deactivateApp, toggleApp } from "./redux/app";
import App from "./components/App";

const middlewares = [
  thunk,
  process.env.NODE_ENV !== "production" && logger,
].filter(Boolean);

export const store = createStore(reducers, applyMiddleware(...middlewares));

export function activate() {
  store.dispatch(activateApp());
}

export function deactivate() {
  store.dispatch(deactivateApp());
}

export function toggle() {
  store.dispatch(toggleApp());
}

export default function init(container) {
  const host = document.createElement("div");
  host.setAttribute("data-ui-capsule", "");
  container.insertAdjacentElement("beforebegin", host);

  store.subscribe(() => {
    const state = store.getState();
    if (state.app.enabled) {
      render(
        <Provider store={store}>
          <App container={container} />
        </Provider>,
        host
      );
    } else {
      unmountComponentAtNode(host);
    }
  });
}
