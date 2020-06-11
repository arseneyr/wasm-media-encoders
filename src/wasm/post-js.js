Module.ready = Module.ready.then(function (m) {
  m["_malloc"] = _malloc;
  m["_free"] = _free;

  m["_enc_init"] = _enc_init;
  m["_enc_free"] = _enc_free;
  m["_enc_encode"] = _enc_encode;
  m["_enc_flush"] = _enc_flush;
  m["_enc_get_pcm"] = _enc_get_pcm;
  m["_enc_get_out_buf"] = _enc_get_out_buf;

  m["HEAP32"] = HEAP32;
  m["HEAPF32"] = HEAPF32;
  m["HEAPU8"] = HEAPU8;

  return m;
});
