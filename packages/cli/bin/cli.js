#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const process = require("process");
const chalk = require("chalk");
const { Command } = require("commander");
const { addTheme, addThemeFragment } = require("../src/theming");

const program = new Command();

const importJSConfig = (path) => {
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
  .action(async (opts) => {
    const { output: outputPath, config: passedConfigPath, private } = opts;
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
          isPrivate: private,
        });
      });
    }

    if (themeFragments) {
      Object.keys(themeFragments).forEach((fragmentName) => {
        addThemeFragment(fragmentName, themeFragments[fragmentName], {
          outputPath,
          isPrivate: private,
        });
      });
    }
  });

program.parse(process.argv);
