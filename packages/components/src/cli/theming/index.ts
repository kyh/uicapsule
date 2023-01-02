import fs from "fs";
import path from "path";
import chalk from "chalk";
import {
  PartialUserThemeDefinition,
  FullThemeDefinition,
  TokenType,
  TransformedToken,
} from "./tokens/types";
import {
  Name as SemanticColorName,
  GeneratedOnName as GeneratedOnColorName,
  GeneratedRGBName as GeneratedRGBColorName,
} from "./tokens/color/color.types";
import { GeneratedName as GeneratedUnitName } from "./tokens/unit/unit.types";
import * as transforms from "./tokens/transforms";
import mergeDefinitions from "./utilities/mergeDefinitions";
import { getOnColor, hexToRgbString } from "./utilities/color";
import { capitalize } from "./utilities/string";
import { variablesTemplate, mediaTemplate } from "./utilities/css";
import uicapsuleDefinition from "./definitions/uic";
import baseDefinition from "./definitions/base";
import type * as T from "./types";

const generateBackgroundColors = (
  definition: T.PartialDeep<FullThemeDefinition>
) => {
  const bgWithDynamicForeground: SemanticColorName[] = [
    "backgroundNeutral",
    "backgroundNeutralHighlighted",
    "backgroundPrimary",
    "backgroundPrimaryHighlighted",
    "backgroundCritical",
    "backgroundCriticalHighlighted",
    "backgroundPositive",
    "backgroundPositiveHighlighted",
  ];

  if (!definition.color) return;

  Object.keys(definition.color).forEach((tokenName) => {
    const bgToken = definition.color?.[tokenName as SemanticColorName];
    const generatedForegroundName = `on${capitalize(
      tokenName
    )}` as GeneratedOnColorName;
    const generatedRGBName = `rgb${capitalize(
      tokenName
    )}` as GeneratedRGBColorName;
    const needsDynamicForeground = bgWithDynamicForeground.includes(
      tokenName as SemanticColorName
    );
    const needsRGB =
      tokenName.startsWith("background") ||
      tokenName.endsWith("black") ||
      tokenName.endsWith("white");

    if (!bgToken) return;

    if (needsDynamicForeground) {
      // eslint-disable-next-line no-param-reassign
      definition.color![generatedForegroundName] = {
        hex: getOnColor(bgToken.hex!),
        hexDark: bgToken.hexDark && getOnColor(bgToken.hexDark),
      };
    }

    if (needsRGB) {
      // eslint-disable-next-line no-param-reassign
      definition.color![generatedRGBName] = {
        hex: hexToRgbString(bgToken.hex!),
        hexDark: bgToken.hexDark && hexToRgbString(bgToken.hexDark),
      };
    }
  });
};

const generateUnits = (definition: T.PartialDeep<FullThemeDefinition>) => {
  const baseValue = definition.unit?.base?.px;

  // If base value hasn't changed, we don't need to regenerate tokens
  if (!baseValue) return;

  for (let i = 1; i <= 10; i += 1) {
    const generatedName = `x${i}` as GeneratedUnitName;

    // eslint-disable-next-line no-param-reassign
    definition.unit![generatedName] = {
      px: baseValue * i,
    };
  }
};

const transformDefinition = (
  name: string,
  definition: T.PartialDeep<FullThemeDefinition>,
  options: T.PrivateOptions
) => {
  const { outputPath, isPrivate, isFragment } = options;

  generateBackgroundColors(definition);
  generateUnits(definition);

  const transformedStorage: Record<
    TransformedToken["type"],
    TransformedToken[]
  > = {
    variable: [],
    media: [],
  };

  Object.entries(definition).forEach(([tokenType, tokenValues]) => {
    if (!tokenValues) return;

    const transform = transforms.css[tokenType as TokenType];

    Object.entries(tokenValues).forEach(([tokenName, token]) => {
      const transformedTokens = transform(
        tokenName,
        token,
        definition as FullThemeDefinition
      );

      transformedTokens.forEach((transformedToken) => {
        transformedStorage[transformedToken.type].push(transformedToken);
      });
    });
  });

  const variablesCode = variablesTemplate(name, transformedStorage.variable);
  const themeFolderPath = isFragment
    ? path.resolve(outputPath, "fragments", name)
    : path.resolve(outputPath, name);
  const themePath = path.resolve(themeFolderPath, "theme.css");

  fs.mkdirSync(themeFolderPath, { recursive: true });
  fs.writeFileSync(themePath, variablesCode);

  if (isPrivate && !isFragment) {
    const mediaCode = mediaTemplate(transformedStorage.media);
    const mediaPath = path.resolve(outputPath, "media.css");
    fs.writeFileSync(mediaPath, mediaCode);
  }

  const logOutput = `Compiled ${chalk.bold(name)} theme${
    isFragment ? " fragment" : ""
  }`;

  // eslint-disable-next-line no-console
  console.log(chalk.green(logOutput));
};

export const addThemeFragment = (
  name: string,
  definition: PartialUserThemeDefinition,
  options: T.PublicOptions
) => {
  transformDefinition(name, definition, { ...options, isFragment: true });
};

export const addTheme = (
  name: string,
  definition: PartialUserThemeDefinition,
  options: T.PublicOptions
) => {
  const withUIC = mergeDefinitions(uicapsuleDefinition, definition);
  const withBase = mergeDefinitions(withUIC, baseDefinition);
  transformDefinition(name, withBase, options);
};
