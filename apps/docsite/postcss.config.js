const defaultConfig = require("@uicapsule/components/postcss.config");

module.exports = {
  plugins: {
    ...defaultConfig.plugins,
    autoprefixer: {},
    cssnano: { preset: ["default", { calc: false }] },
  },
};
