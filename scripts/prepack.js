const pkg = require("../package.json");
const fs = require("fs");
const path = require("path");
const copyfiles = require("copyfiles");

const basePath = path.resolve(__dirname, "..");
const genPath = (...segments) => path.resolve(basePath, ...segments);

const newPkg = {
  ...pkg,
  main: "bundle/index.js",
  browser: "index.js",
  scripts: undefined,
};

fs.writeFileSync(
  genPath("dist", "package.json"),
  JSON.stringify(newPkg, null, 2)
);

copyfiles([genPath("LICENSE"), genPath("dist")], true, () => {});
