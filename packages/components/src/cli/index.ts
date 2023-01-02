#!/usr/bin/env npx ts-node

import fs from "fs";
import path from "path";
import process from "process";
import chalk from "chalk";
import { Command } from "commander";
import defaultTheme from "./theming/definitions/uic";
import { addTheme, addThemeFragment } from "./theming";

const program = new Command();

const importJSConfig = (path: string) => {
  console.log(chalk.yellow(`Using config at ${path}`));
  // eslint-disable-next-line global-require,import/no-dynamic-require
  const config = require(path);
  return config.default || config;
};

program
  .description("Create new themes for your design system")
  .command("theming")
  .requiredOption("-o, --output <path>", "Path to output generated themes")
  .option("-c, --config <path>", "Path to the config file")
  .option(
    "--private",
    "Package private theme generation that also builds mixins and media queries"
  )
  .option("--default", "Generate default UIC theme")
  .action(async (opts: any) => {
    const {
      output: outputPath,
      config: passedConfigPath,
      private: isPrivate,
    } = opts;
    const originPath = process.cwd();
    let configPath;
    const jsConfigPath = path.resolve(originPath, "uic.config.js");
    const tsConfigPath = path.resolve(originPath, "uic.config.ts");

    if (passedConfigPath) {
      const attemptPath = path.resolve(originPath, passedConfigPath);
      if (fs.existsSync(attemptPath)) configPath = attemptPath;
    }

    if (!passedConfigPath && fs.existsSync(jsConfigPath))
      configPath = jsConfigPath;
    if (!passedConfigPath && fs.existsSync(tsConfigPath))
      configPath = tsConfigPath;

    if (!configPath) {
      console.error(chalk.red("Error: Config not found"));
      return;
    }

    console.log(chalk.blue("Processing themes..."));
    const config = importJSConfig(configPath);
    const { themes, themeFragments } = config;

    if (opts.default) {
      themes["uicapsule"] = defaultTheme;
    }

    if (themes) {
      Object.keys(themes).forEach((themeName) => {
        addTheme(themeName, themes[themeName], {
          outputPath,
          isPrivate,
        });
      });
    }

    if (themeFragments) {
      Object.keys(themeFragments).forEach((fragmentName) => {
        addThemeFragment(fragmentName, themeFragments[fragmentName], {
          outputPath,
          isPrivate,
        });
      });
    }
  });

program.parse(process.argv);
