const { mergeConfig } = require("vite");
const tsconfigPaths = require("vite-tsconfig-paths");

module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-storysource", "@storybook/addon-a11y"],
  framework: "@storybook/react",
  core: {
    builder: "@storybook/builder-vite",
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      plugins: [tsconfigPaths.default()],
    });
  },
  staticDirs: ["../public"],
};
