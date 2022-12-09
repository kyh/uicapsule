module.exports = {
  stories: [`**/*.stories.mdx`, `**/*.stories.tsx`],
  addons: [
    // "@storybook/addon-storysource",
    // "@storybook/addon-a11y",
    // "@pxblue/storybook-rtl-addon/register",
  ],
  framework: "@storybook/react",
  core: {
    builder: "@storybook/builder-vite",
  },
};
