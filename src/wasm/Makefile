all:  lame.wasm vorbis.wasm

ifeq ($(NODE_ENV),production)
  emcc_flags = -Oz -flto --closure 1 
else
  emcc_flags = -O0 -g
endif

lame/lame-src/dist/lib/libmp3lame.a:
	cd lame/lame-src && \
	git reset --hard && \
	emconfigure ./configure \
		CFLAGS="-DNDEBUG -DNO_STDIO $(emcc_flags)" \
		LDFLAGS="$(emcc_flags)" \
		--cache-file=/emsdk_portable/.data/config.cache \
		--prefix="$$(pwd)/dist" \
		--disable-shared \
		\
		--disable-gtktest \
		--disable-analyzer-hooks \
		--disable-decoder \
		--disable-frontend \
		&& \
	emmake make -j8 && \
	emmake make install

lame.wasm: lame/lame-src/dist/lib/libmp3lame.a lame/lame_enc.c
	@mkdir -p build
	emcc $^ \
	  -DNDEBUG $(emcc_flags) -Ilame/lame-src/dist/include \
		--post-js post-js.js \
		-s MALLOC=emmalloc \
		-s MINIMAL_RUNTIME \
		-s MODULARIZE \
		-s EXPORT_ES6 \
		-s ALLOW_MEMORY_GROWTH \
		-s "EXPORTED_FUNCTIONS=['_enc_init','_enc_free','_enc_encode','_enc_flush','_enc_get_pcm','_enc_get_out_buf']" \
		-s ENVIRONMENT="worker,web" \
		-o build/mp3.js

vorbis/ogg-src/dist/lib/libogg.a:
	cd vorbis/ogg-src && \
	git reset --hard && \
	emcmake cmake . \
		-DCMAKE_INSTALL_PREFIX=$$(pwd)/dist \
		-DCMAKE_C_FLAGS="$(emcc_flags)" \
		-DCMAKE_MODULE_LINKER_FLAGS_INIT="$(emcc_flags)" \
		&& \
	cmake --build . --target install

vorbis/vorbis-src/dist/lib/libvorbis.a: vorbis/ogg-src/dist/lib/libogg.a
	cd vorbis/vorbis-src && \
	git reset --hard && \
	emcmake cmake . \
		-DCMAKE_INSTALL_PREFIX=$$(pwd)/dist \
		-DCMAKE_C_FLAGS="$(emcc_flags)" \
		-DCMAKE_MODULE_LINKER_FLAGS_INIT="$(emcc_flags)" \
		-DOGG_INCLUDE_DIRS=/src/src/wasm/vorbis/ogg-src/dist/include \
		-DOGG_LIBRARIES=/src/src/wasm/vorbis/ogg-src/dist/lib/libogg.a \
		&& \
	emmake make all install

vorbis.wasm: \
	vorbis/ogg-src/dist/lib/libogg.a \
	vorbis/vorbis-src/dist/lib/libvorbis.a \
	vorbis/vorbis-src/dist/lib/libvorbisenc.a \
	vorbis/vorbis_enc.c
	emcc $^ \
	  $(emcc_flags) -Ivorbis/vorbis-src/dist/include -Ivorbis/ogg-src/dist/include \
		--post-js post-js.js \
		-s MALLOC=emmalloc \
		-s MINIMAL_RUNTIME \
		-s MODULARIZE \
		-s EXPORT_ES6 \
		-s ALLOW_MEMORY_GROWTH \
		-s "EXPORTED_FUNCTIONS=['_enc_init','_enc_free','_enc_encode','_enc_flush','_enc_get_pcm','_enc_get_out_buf']" \
		-s ENVIRONMENT="worker,web" \
		-o build/ogg.js

clean:
	git -C vorbis/ogg-src clean -fxd && \
	git -C vorbis/vorbis-src clean -fxd && \
	git -C lame/lame-src clean -fxd