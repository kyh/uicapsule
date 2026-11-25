import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "wxt";
import type { UserManifest } from "wxt";

const DEV_KEY =
  "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAknBZ9lLR+l6QTkgp7UZ+mlNyS4GVyJXqsIEDLpzuEiGjl6Pl6J8AHRQLPhFAQZELUVc8eB+6GEvCeswkCBwZJLddwzleipcQnLiIKO5gG+ex28FeK86UKOKEb0euHOF/4R0xrMfIxQjDMCvreAl57wdHMs2NyLAVE0/56y+8mSBcMMTaONIw4nMo0dk+3KtxZ38uJoTNPlPwIvMpjQUmHvuIllziDzwbf6D3REi0nqdtGXIjyjvy4pST1J1n8Ty38lOuU1FcyP6eTp44kwsjzEWrrWSiQMASEZtkpB+Ps593oJ46A4C6/KGA//345+ShJGPYiOOLwmmPati9yCElawIDAQAB";

export default defineConfig({
  dev: { server: { port: 3001 } },
  manifest: ({ mode }) => {
    const manifest: UserManifest = {
      action: { default_title: "Request a component" },
      description: "Select part of any page and request it as a UICapsule component.",
      host_permissions: ["https://www.uicapsule.com/*", "http://localhost/*"],
      name: "UICapsule",
      optional_host_permissions: ["<all_urls>"],
      permissions: ["activeTab", "scripting", "storage"],
      version: "0.1.0",
    };

    if (mode !== "store") {
      manifest.key = DEV_KEY;
    }

    return manifest;
  },
  srcDir: "src",
  vite: () => ({ plugins: [react(), tailwindcss()] }),
});
