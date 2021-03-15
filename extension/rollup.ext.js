import path from "path";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import replace from "@rollup/plugin-replace";
import {
  chromeExtension,
  simpleReloader,
} from "rollup-plugin-chrome-extension";
import { terser } from "rollup-plugin-terser";
import empty from "rollup-plugin-empty";
import copy from "rollup-plugin-copy";

const isProduction = process.env.NODE_ENV === "production";

export const emptyArgs = {
  silent: false,
  dir: "dist",
};

export const replaceArgs = {
  preventAssignment: true,
  "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  "process.env.FIREBASE_API_KEY": JSON.stringify(process.env.FIREBASE_API_KEY),
  "process.env.FIREBASE_AUTH_DOMAIN": JSON.stringify(
    process.env.FIREBASE_AUTH_DOMAIN
  ),
  "process.env.FIREBASE_PROJECT_ID": JSON.stringify(
    process.env.FIREBASE_PROJECT_ID
  ),
  "process.env.WEBPAGE": JSON.stringify(process.env.WEBPAGE),
};

export const babelArgs = {
  ignore: ["node_modules"],
  babelHelpers: "bundled",
};

export default {
  input: "src/manifest.json",
  output: {
    dir: "dist",
    format: "esm",
    chunkFileNames: path.join("chunks", "[name]-[hash].js"),
  },
  plugins: [
    isProduction && empty(emptyArgs),
    chromeExtension(),
    simpleReloader(),
    replace(replaceArgs),
    babel(babelArgs),
    resolve(),
    commonjs(),
    copy({
      targets: [{ src: "src/public/**/*", dest: "dist/public" }],
    }),
    isProduction && terser(),
  ],
};
