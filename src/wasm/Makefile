all: debug

debug: build/ogg.wasm build/mp3.wasm build/ogg.wasm.map build/mp3.wasm.map

.PHONY: all debug clean

ifeq ($(NODE_ENV),production)
  emcc_flags = -Oz -flto
  emcc_linker_flags = -Oz -flto -Wl,--strip-all
else
  emcc_flags = -O0 -g
	emcc_linker_flags = -O0 -g4 --source-map-base file:/$(abspath build)
endif

LAME_PATH = lame/lame-src
OGG_PATH = vorbis/ogg-src
VORBIS_PATH = vorbis/vorbis-src
LAME_INSTALL := $(LAME_PATH)/dist
OGG_INSTALL := $(OGG_PATH)/dist
VORBIS_INSTALL := $(VORBIS_PATH)/dist

$(LAME_INSTALL)/lib/libmp3lame.a:
	cd $(LAME_PATH) && \
	emconfigure ./configure \
		CFLAGS="-DNDEBUG -DNO_STDIO $(emcc_flags)" \
		LDFLAGS="$(emcc_flags)" \
		--prefix="$(abspath $(LAME_INSTALL))" \
		--disable-shared \
		--disable-gtktest \
		--disable-analyzer-hooks \
		--disable-decoder \
		--disable-frontend && \
	emmake make -j8 && \
	emmake make install

build/mp3_full.wasm: $(LAME_INSTALL)/lib/libmp3lame.a lame/lame_enc.c
	emcc $^ \
	  -DNDEBUG $(emcc_linker_flags) \
		-I$(abspath $(LAME_INSTALL))/include \
		--no-entry \
		-s MALLOC=emmalloc \
		-s ALLOW_MEMORY_GROWTH \
		-s STANDALONE_WASM \
		-s NO_SUPPORT_ERRNO \
		-o $@
	
build/mp3.wasm.map: build/mp3_full.wasm
	mv build/mp3_full.wasm.map build/mp3.wasm.map

build/mp3.wasm: build/mp3_full.wasm minify_graph.json
	/emsdk/upstream/bin/wasm-metadce --graph-file minify_graph.json -o $@ build/mp3_full.wasm

$(OGG_INSTALL)/lib/libogg.a:
	cd $(OGG_PATH) && \
	emcmake cmake . \
		-DCMAKE_INSTALL_PREFIX=$(abspath $(OGG_INSTALL)) \
		-DCMAKE_C_FLAGS="$(emcc_flags)" \
		-DCMAKE_MODULE_LINKER_FLAGS_INIT="$(emcc_flags)" \
		&& \
	cmake --build . --target install

$(VORBIS_INSTALL)/lib/libvorbis.a: $(OGG_INSTALL)/lib/libogg.a
	cd vorbis/vorbis-src && \
	emcmake cmake . \
		-DCMAKE_INSTALL_PREFIX=$(abspath $(VORBIS_INSTALL)) \
		-DCMAKE_C_FLAGS="$(emcc_flags)" \
		-DCMAKE_MODULE_LINKER_FLAGS_INIT="$(emcc_flags)" \
		-DOGG_INCLUDE_DIR=$(abspath $(OGG_INSTALL))/include \
		-DOGG_LIBRARY=$(abspath $(OGG_INSTALL))/lib/libogg.a \
		&& \
	emmake make all install

build/ogg_full.wasm: \
	$(OGG_INSTALL)/lib/libogg.a \
	$(VORBIS_INSTALL)/lib/libvorbis.a \
	$(VORBIS_INSTALL)/lib/libvorbisenc.a \
	vorbis/vorbis_enc.c
	emcc $^ \
	  $(emcc_linker_flags) -I$(abspath $(VORBIS_INSTALL))/include -I$(abspath $(OGG_INSTALL))/include \
		--no-entry \
		-s MALLOC=emmalloc \
		-s ALLOW_MEMORY_GROWTH \
		-s STANDALONE_WASM \
		-s NO_SUPPORT_ERRNO \
		-o $@

build/ogg.wasm: build/ogg_full.wasm minify_graph.json
	/emsdk/upstream/bin/wasm-metadce --graph-file minify_graph.json -o $@ build/ogg_full.wasm

build/ogg.wasm.map: build/ogg_full.wasm
	mv build/ogg_full.wasm.map build/ogg.wasm.map

.INTERMEDIATE: build/ogg_full.wasm build/mp3_full.wasm

clean:
	git -C vorbis/ogg-src clean -fxd && \
	git -C vorbis/vorbis-src clean -fxd && \
	git -C lame/lame-src clean -fxd && \
	rm build/*