import { createEncoder, WasmMediaEncoder } from "./encoder";
import { name, version } from "../package.json";

const createMp3Encoder = createEncoder.bind(
  null,
  "audio/mpeg",
  `https://unpkg.com/${name}@${version}/wasm/mp3.wasm`
);

const createOggEncoder = createEncoder.bind(
  null,
  "audio/ogg",
  `https://unpkg.com/${name}@${version}/wasm/ogg.wasm`
);

const UMDEncoder: any = WasmMediaEncoder;
UMDEncoder.createEncoder = createEncoder;
UMDEncoder.createMp3Encoder = createMp3Encoder;
UMDEncoder.createOggEncoder = createOggEncoder;

export default UMDEncoder;
