import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@/assets/globals.css";
import { App } from "./app";

const root = document.querySelector("#root");
const dark = window.matchMedia("(prefers-color-scheme: dark)");

document.documentElement.classList.toggle("dark", dark.matches);

if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
