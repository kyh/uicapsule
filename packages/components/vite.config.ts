import { resolve } from "path";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import react from "@vitejs/plugin-react-swc";
import * as packageJson from "./package.json";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  build: {
    lib: {
      entry: resolve("src", "index.ts"),
      name: packageJson.name,
      formats: ["es", "umd"],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: [...Object.keys(packageJson.peerDependencies)],
    },
  },
});
