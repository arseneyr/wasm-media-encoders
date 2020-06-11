const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");

["mp3.js", "ogg.js"].forEach((f) =>
  fs.writeFileSync(
    path.resolve(__dirname, "build", f),
    fs
      .readFileSync(path.resolve(__dirname, "build", f), "utf8")
      .replace(/(\w+)\.instance\.exports/, "($1.exports||$&)")
  )
);

//rimraf(path.resolve(__dirname, "build") + "/!(index).js", () => {});
