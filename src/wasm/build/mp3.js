var Module=
function(Module) {
  Module = Module || {};


var c;c||(c=Module);var e;c.ready=new Promise(function(a){e=a});var f=new WebAssembly.Memory({initial:256,maximum:32768}),h=f.buffer,k=new WebAssembly.Table({initial:14,maximum:14,element:"anyfunc"}),l,m,n;function p(a){h=a;new Int8Array(a);new Int16Array(a);l=new Int32Array(a);m=new Uint8Array(a);new Uint16Array(a);new Uint32Array(a);n=new Float32Array(a);new Float64Array(a)}p(h);l[24668]=5341712;var q,r,t,u,v,w,x,z;
WebAssembly.instantiate(c.wasm,{a:{b:function(a,g,d){m.copyWithin(a,g,g+d)},c:function(a){a>>>=0;var g=m.length;if(2147483648<a)return!1;for(var d=1;4>=d;d*=2){var b=g*(1+.2/d);b=Math.min(b,a+100663296);b=Math.max(16777216,a,b);0<b%65536&&(b+=65536-b%65536);a:{try{f.grow(Math.min(2147483648,b)-h.byteLength+65535>>>16);p(f.buffer);var y=1;break a}catch(A){}y=void 0}if(y)return!0}return!1},a:function(a){throw"exit("+a+")";},memory:f,table:k}}).then(function(a){a=(a.exports||a.instance.exports);q=a.e;r=a.f;t=a.g;
u=a.h;v=a.i;w=a.j;x=a.k;z=a.l;a.d();e(c)});c.ready=c.ready.then(function(a){a._malloc=v;a._free=u;a._enc_init=w;a._enc_free=t;a._enc_encode=x;a._enc_flush=z;a._enc_get_pcm=q;a._enc_get_out_buf=r;a.HEAP32=l;a.HEAPF32=n;a.HEAPU8=m;return a});


  return Module.ready
}
export default Module;