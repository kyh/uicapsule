import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import replace from "@rollup/plugin-replace";
import empty from "rollup-plugin-empty";
import { terser } from "rollup-plugin-terser";
import { emptyArgs, replaceArgs, babelArgs } from "./rollup.ext";

export default {
  input: "src/module.js",
  output: {
    file: "dist/module.js",
    format: "cjs",
  },
  external: ["react", "react-dom", "styled-components"],
  plugins: [
    empty(emptyArgs),
    replace(replaceArgs),
    babel(babelArgs),
    resolve(),
    commonjs(),
    terser(),
  ],
};
