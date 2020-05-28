const fs = require("fs");
const path = require("path");

fs.writeFileSync(
  path.resolve(__dirname, "dist/index.js"),
  fs
    .readFileSync(path.resolve(__dirname, "dist/mp3.js"), "utf8")
    .replace(/output\.instance\.exports/, "(output.exports || $&)")
);
