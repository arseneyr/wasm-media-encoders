const fs = require("fs");
const path = require("path");
const copyfiles = require("copyfiles");

["mp3.js", "ogg.js"]
  .map((f) => path.resolve(__dirname, "../src/wasm/build", f))
  .forEach((f) =>
    fs.writeFileSync(
      f,
      fs
        .readFileSync(f, "utf8")
        .replace(/(\w+)\.instance\.exports/, "($1.exports||$&)")
    )
  );

copyfiles(["src/wasm/build/*.wasm", "wasm"], true, () => {});
