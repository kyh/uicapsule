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
import zip from "rollup-plugin-zip";

const isProduction = process.env.NODE_ENV === "production";

export default {
  input: "src/manifest.json",
  output: {
    dir: "dist",
    format: "esm",
    chunkFileNames: "chunks/[name]-[hash].js",
  },
  plugins: [
    empty({
      silent: false,
      dir: "dist",
    }),
    chromeExtension(),
    simpleReloader(),
    replace({
      "process.env.NODE_ENV": process.env.NODE_ENV,
    }),
    babel({
      ignore: ["node_modules"],
      babelHelpers: "bundled",
    }),
    resolve(),
    commonjs(),
    copy({
      targets: [{ src: "src/public/**/*", dest: "dist/public" }],
    }),
    // Outputs a zip file in ./releases
    isProduction && zip({ dir: "releases" }),
    isProduction && terser(),
  ],
};
