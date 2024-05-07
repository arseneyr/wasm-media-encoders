// import { fileURLToPath } from "url";
// import process from "process";
import { name, version } from "../package.json";
import { SupportedMimeTypes } from "./encoder";

function getVersion(mimeType: SupportedMimeTypes) {
  return `${name}-${version}-${mimeType}`;
}

// function checkMimeType(
//   mimeType: string
// ): asserts mimeType is SupportedMimeTypes {
//   if (mimeType !== "audio/mpeg" && mimeType !== "audio/ogg") {
//     throw new Error(`unknown MIME type ${mimeType}`);
//   }
// }

// if (process.argv[1] === fileURLToPath(import.meta.url)) {
//   const mimeType = process.argv[2];
//   checkMimeType(mimeType);
//   process.stdout.write(getVersion(mimeType));
// }

export default getVersion;
