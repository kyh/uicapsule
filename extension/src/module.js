import React from "react";
import { render, unmountComponentAtNode } from "react-dom";
import { applyMiddleware, createStore } from "redux";
import logger from "redux-logger";
import thunk from "redux-thunk";
import { Provider } from "react-redux";
import reducers from "./redux/reducers";
import { activateApp, deactivateApp, toggleApp } from "./redux/app";
import App from "./components/App";

const ROOT_EL_IDENTIFIER = "data-ui-capsule";
const middlewares = [
  thunk,
  process.env.NODE_ENV !== "production" && logger,
].filter(Boolean);

export const store = createStore(reducers, applyMiddleware(...middlewares));

export function activate() {
  const state = store.getState();
  if (!state.app.enabled) {
    store.dispatch(activateApp());
  }
}

export function deactivate() {
  const state = store.getState();
  if (state.app.enabled) {
    store.dispatch(deactivateApp());
  }
}

export function toggle() {
  store.dispatch(toggleApp());
}

export function unmount() {
  const rootEl = document.querySelector(`[${ROOT_EL_IDENTIFIER}]`);
  if (rootEl) rootEl.remove();
}

export function mount(container = document.body, demoMode = false) {
  const host = document.createElement("div");
  host.setAttribute(ROOT_EL_IDENTIFIER, "");
  container.insertAdjacentElement("beforebegin", host);

  store.subscribe(() => {
    const state = store.getState();
    if (state.app.enabled) {
      render(
        <Provider store={store}>
          <App container={container} demoMode={demoMode} />
        </Provider>,
        host
      );
    } else {
      unmountComponentAtNode(host);
    }
  });
}
