const path = require("path");

module.exports = {
  plugins: {
    "postcss-import": {},
    "postcss-nested": {},
    "postcss-each": {},
    "postcss-custom-media": {
      importFrom: path.resolve(__dirname, "src/themes/media.css"),
    },
  },
};
