const path = require("path");
const importPlugin = require("postcss-import");
const nestedPlugin = require("postcss-nested");
const eachPlugin = require("postcss-each");
const customMediaPlugin = require("postcss-custom-media");

module.exports = {
  plugins: [
    importPlugin(),
    eachPlugin(),
    nestedPlugin(),
    customMediaPlugin({
      importFrom: path.resolve(__dirname, "src/themes/media.css"),
    }),
  ],
};
