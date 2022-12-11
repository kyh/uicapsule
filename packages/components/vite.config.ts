import { resolve } from "path";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import dts from "vite-plugin-dts";
import * as packageJson from "./package.json";

export default {
  plugins: [tsconfigPaths(), react(), dts()],
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
