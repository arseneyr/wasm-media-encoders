all:  lame.wasm

lame/lame-src/dist/lib/libmp3lame.so:
	cd lame/lame-src && \
	git reset --hard && \
	emconfigure ./configure -C \
		CFLAGS="-DNDEBUG -Oz -flto" \
		--prefix="$$(pwd)/dist" \
		--host=x86-none-linux \
		--disable-static \
		\
		--disable-gtktest \
		--disable-analyzer-hooks \
		--disable-decoder \
		--disable-frontend \
		&& \
	emmake make -j8 && \
	emmake make install

ifeq ($(NODE_ENV),production)
  emcc_flags = -Oz
	closure_flag = 1
else
  emcc_flags = -O0 -g
	closure_flag = 0
endif

lame.wasm: lame/lame-src/dist/lib/libmp3lame.so lame/lame_enc.c
	@mkdir -p dist
	emcc $^ \
	  -DNDEBUG $(emcc_flags) -Ilame/lame-src/dist/include \
		--pre-js pre-js.js \
		--closure $(closure_flag) \
		-s MALLOC=emmalloc \
		-s MINIMAL_RUNTIME \
		-s MODULARIZE \
		-s EXPORT_ES6 \
		-s ALLOW_MEMORY_GROWTH \
		-s "EXPORTED_FUNCTIONS=['_enc_init','_enc_free','_enc_encode','_enc_flush']" \
		-s ENVIRONMENT="worker,web" \
		-o dist/mp3.js

clean:
	emmake $(MAKE) -C lame/lame-src distclean