Module["ready"] = function () {
  if (Module["onReady"]) Module["onReady"](Module);
};
Module["_mrp_init"] = _mrp_init;
Module["_mrp_encode"] = _mrp_encode;
Module["_mrp_flush"] = _mrp_flush;
Module["_mrp_free"] = _mrp_free;
Module["HEAP32"] = HEAP32;
Module["HEAPU8"] = HEAPU8;
Module["HEAPF32"] = HEAPF32;
Module["_malloc"] = _malloc;
Module["_free"] = _free;
