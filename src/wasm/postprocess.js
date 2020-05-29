const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");

fs.writeFileSync(
  path.resolve(__dirname, "build", "index.js"),
  fs
    .readFileSync(path.resolve(__dirname, "build", "mp3.js"), "utf8")
    .replace(/(\w+)\.instance\.exports/, "($1.exports||$&)")
);

rimraf(path.resolve(__dirname, "build") + "/!(index).js", () => {});
