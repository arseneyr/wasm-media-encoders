var Module=
function(Module) {
  Module = Module || {};


var c;c||(c=Module);var f;c.ready=new Promise(function(a){f=a});var g=new WebAssembly.Memory({initial:256,maximum:32768}),h=g.buffer,k=new WebAssembly.Table({initial:30,maximum:30,element:"anyfunc"}),l,m,n;function p(a){h=a;new Int8Array(a);new Int16Array(a);l=new Int32Array(a);m=new Uint8Array(a);new Uint16Array(a);new Uint32Array(a);n=new Float32Array(a);new Float64Array(a)}p(h);l[142284]=5812176;var q,r,t,u,v,w,x,z;
WebAssembly.instantiate(c.wasm,{a:{a:function(a,d,e){m.copyWithin(a,d,d+e)},b:function(a){a>>>=0;var d=m.length;if(2147483648<a)return!1;for(var e=1;4>=e;e*=2){var b=d*(1+.2/e);b=Math.min(b,a+100663296);b=Math.max(16777216,a,b);0<b%65536&&(b+=65536-b%65536);a:{try{g.grow(Math.min(2147483648,b)-h.byteLength+65535>>>16);p(g.buffer);var y=1;break a}catch(A){}y=void 0}if(y)return!0}return!1},d:function(a){throw"exit("+a+")";},memory:g,table:k,c:function(a){var d=Date.now()/1E3|0;a&&(l[a>>2]=d);return d}}}).then(function(a){a=
(a.exports||a.instance.exports);q=a.f;r=a.g;t=a.h;u=a.i;v=a.j;w=a.k;x=a.l;z=a.m;a.e();f(c)});c.ready=c.ready.then(function(a){a._malloc=r;a._free=t;a._enc_init=w;a._enc_free=v;a._enc_encode=x;a._enc_flush=z;a._enc_get_pcm=q;a._enc_get_out_buf=u;a.HEAP32=l;a.HEAPF32=n;a.HEAPU8=m;return a});


  return Module.ready
}
export default Module;