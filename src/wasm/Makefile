all:  lame.wasm vorbis.wasm

ifeq ($(NODE_ENV),production)
  emcc_flags = -Oz -flto
  emcc_linker_flags = -Oz -flto -Wl,--strip-all
else
  emcc_flags = -O0 -g -fdebug-prefix-map=/src/=
	emcc_linker_flags = -O0 -g4 -fdebug-prefix-map=/src/= --source-map-base file://$(BUILD_DIR)/
endif

lame/lame-src/dist/lib/libmp3lame.a:
	cd lame/lame-src && \
	emconfigure ./configure \
		CFLAGS="-DNDEBUG -DNO_STDIO $(emcc_flags)" \
		LDFLAGS="$(emcc_flags)" \
		--prefix="$$(pwd)/dist" \
		--disable-shared \
		\
		--disable-gtktest \
		--disable-analyzer-hooks \
		--disable-decoder \
		--disable-frontend && \
	emmake make -j8 && \
	emmake make install

lame.wasm: lame/lame-src/dist/lib/libmp3lame.a lame/lame_enc.c
	@mkdir -p build
	emcc $^ \
	  -DNDEBUG $(emcc_linker_flags) -Ilame/lame-src/dist/include \
		--no-entry \
		-s MALLOC=emmalloc \
		-s ALLOW_MEMORY_GROWTH \
		-s STANDALONE_WASM \
		-s NO_SUPPORT_ERRNO \
		-o build/mp3.wasm && \
	/emsdk/upstream/bin/wasm-metadce --graph-file ./minify_graph.json -o build/mp3.wasm build/mp3.wasm

vorbis/ogg-src/dist/lib/libogg.a:
	cd vorbis/ogg-src && \
	emcmake cmake . \
		-DCMAKE_INSTALL_PREFIX=$$(pwd)/dist \
		-DCMAKE_C_FLAGS="$(emcc_flags)" \
		-DCMAKE_MODULE_LINKER_FLAGS_INIT="$(emcc_flags)" \
		&& \
	cmake --build . --target install

vorbis/vorbis-src/dist/lib/libvorbis.a: vorbis/ogg-src/dist/lib/libogg.a
	cd vorbis/vorbis-src && \
	emcmake cmake . \
		-DCMAKE_INSTALL_PREFIX=$$(pwd)/dist \
		-DCMAKE_C_FLAGS="$(emcc_flags)" \
		-DCMAKE_MODULE_LINKER_FLAGS_INIT="$(emcc_flags)" \
		-DOGG_INCLUDE_DIR=/src/src/wasm/vorbis/ogg-src/dist/include \
		-DOGG_LIBRARY=/src/src/wasm/vorbis/ogg-src/dist/lib/libogg.a \
		&& \
	emmake make all install

vorbis.wasm: \
	vorbis/ogg-src/dist/lib/libogg.a \
	vorbis/vorbis-src/dist/lib/libvorbis.a \
	vorbis/vorbis-src/dist/lib/libvorbisenc.a \
	vorbis/vorbis_enc.c
	emcc $^ \
	  $(emcc_linker_flags) -Ivorbis/vorbis-src/dist/include -Ivorbis/ogg-src/dist/include \
		--no-entry \
		-s MALLOC=emmalloc \
		-s ALLOW_MEMORY_GROWTH \
		-s STANDALONE_WASM \
		-s NO_SUPPORT_ERRNO \
		-o build/ogg.wasm && \
	/emsdk/upstream/bin/wasm-metadce --graph-file ./minify_graph.json -o build/ogg.wasm build/ogg.wasm

clean:
	git -C vorbis/ogg-src clean -fxd && \
	git -C vorbis/vorbis-src clean -fxd && \
	git -C lame/lame-src clean -fxd