#!/usr/bin/env npx ts-node

import fs from "fs";
import path from "path";
import process from "process";
import chalk from "chalk";
import { Command } from "commander";
import { addTheme, addThemeFragment } from "./theming";

const program = new Command();

const importJSConfig = (path: string) => {
  console.log(chalk.yellow(`Using UICapsule config at ${path}`));
  // eslint-disable-next-line global-require,import/no-dynamic-require
  const config = require(path);
  return config.default || config;
};

program
  .description("Create new themes for UICapsule")
  .command("theming")
  .requiredOption("-o, --output <path>", "Path to output generated themes")
  .option("-c, --config <path>", "Path to the config file")
  .option(
    "--private",
    "Package private theme generation that also builds mixins and media queries"
  )
  .action(async (opts: any) => {
    const {
      output: outputPath,
      config: passedConfigPath,
      private: isPrivate,
    } = opts;
    const originPath = process.cwd();
    let configPath;
    const jsConfigPath = path.resolve(originPath, "uicapsule.config.js");
    const tsConfigPath = path.resolve(originPath, "uicapsule.config.ts");

    if (passedConfigPath) {
      const attemptPath = path.resolve(originPath, passedConfigPath);
      if (fs.existsSync(attemptPath)) configPath = attemptPath;
    }

    if (!passedConfigPath && fs.existsSync(jsConfigPath))
      configPath = jsConfigPath;
    if (!passedConfigPath && fs.existsSync(tsConfigPath))
      configPath = tsConfigPath;

    if (!configPath) {
      console.error(chalk.red("Error: UICapsule config not found"));
      return;
    }

    console.log(chalk.blue("Processing UICapsule themes..."));
    const config = importJSConfig(configPath);
    const { themes, themeFragments } = config;

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
