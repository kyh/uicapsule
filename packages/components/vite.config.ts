import { resolve } from "path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import * as packageJson from "./package.json";

export default {
  plugins: [tsconfigPaths(), react()],
  build: {
    lib: {
      entry: resolve("src", "index.ts"),
      name: packageJson.name,
      formats: ["es", "cjs"],
      fileName: (format: string) =>
        format === "es" ? "index.mjs" : "index.cjs",
    },
    rollupOptions: {
      external: [...Object.keys(packageJson.peerDependencies)],
    },
  },
};
