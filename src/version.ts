import { name, version } from "../package.json";

function getVersion() {
  return `${name}-${version}`;
}

export default getVersion;
