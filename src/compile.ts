function intArrayFromBase64(s: string) {
  try {
    //@ts-ignore
    if (__maybeNode__ && Buffer) {
      return Buffer.from(s, "base64");
    }
    var decoded = atob(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0; i < decoded.length; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch (_) {
    throw new Error("Converting base64 string to bytes failed.");
  }
}
export function parseDataUrl(url: string) {
  const parts = url.split(",");
  if (
    parts.length !== 2 ||
    /^data:(application\/octet-stream|application\/wasm);base64$/.test(
      parts[0]
    ) === false
  ) {
    return null;
  }

  return intArrayFromBase64(parts[1]).buffer;
}

export function compileModule(wasmUrl: string, stream = true) {
  const buffer = parseDataUrl(wasmUrl);
  if (buffer) {
    return WebAssembly.compile(buffer);
  }

  if (WebAssembly.compileStreaming !== undefined && stream) {
    return WebAssembly.compileStreaming(fetch(wasmUrl));
  }

  return fetch(wasmUrl)
    .then((body) => body.arrayBuffer())
    .then(WebAssembly.compile);
}
