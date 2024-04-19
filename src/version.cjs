const { name, version } = require("../package.json");
module.exports = function () {
  return `${name}-${version}`;
};
