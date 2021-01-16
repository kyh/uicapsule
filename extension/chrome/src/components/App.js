import { html } from "../lib/render";
import store from "../reducers/store";

function App({ enabled }) {
  if (!enabled) return "<div></div>";
  return html`<div>
    <style>
      *:hover {
        outline: red dashed 1px !important;
      }
    </style>
    <h1>App is enabled</h1>
  </div>`;
}

export default store.connect(App, (state) => state.app);
