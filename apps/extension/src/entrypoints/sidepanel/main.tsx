import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@/assets/globals.css";
import { App } from "./app";

const root = document.querySelector("#root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
