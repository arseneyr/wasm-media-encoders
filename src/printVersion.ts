import getVersion from "./version.js";

const mimeType = process.argv[2];

if (mimeType === "audio/mpeg" || mimeType === "audio/ogg") {
  process.stdout.write(getVersion(mimeType));
} else {
  throw new Error(`unknown MIME type ${mimeType}`);
}
