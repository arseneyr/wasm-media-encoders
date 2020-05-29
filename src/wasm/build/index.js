var Module=
function(Module) {
  Module = Module || {};

var b;b||(b=Module);function l(a){console.log(a)}function n(a){console.error(a)}b.ready=function(){if(b.onReady)b.onReady(b)};b._enc_init=r;b._enc_encode=t;b._enc_flush=x;b._enc_free=y;b.HEAP32=z;b.HEAPU8=A;b.HEAPF32=B;b._malloc=C;b._free=D;var E="undefined"!==typeof TextDecoder?new TextDecoder("utf8"):void 0,F=new WebAssembly.Memory({initial:256}),I=F.buffer,J=new WebAssembly.Table({initial:20,maximum:20,element:"anyfunc"}),z,A,B;
function K(a){I=a;new Int8Array(a);new Int16Array(a);z=new Int32Array(a);A=new Uint8Array(a);new Uint16Array(a);new Uint32Array(a);B=new Float32Array(a);new Float64Array(a)}K(I);z[24776]=5342144;var L=[null,[],[]],D,C,y,r,t,x;
WebAssembly.instantiate(b.wasm,{a:{e:function(a,g,h){A.copyWithin(a,g,g+h)},f:function(a){var g=A.length;if(2147418112<a)return!1;for(var h=1;4>=h;h*=2){var e=g*(1+.2/h);e=Math.min(e,a+100663296);e=Math.max(16777216,a,e);0<e%65536&&(e+=65536-e%65536);a:{try{F.grow(Math.min(2147418112,e)-I.byteLength+65535>>16);K(F.buffer);var p=1;break a}catch(q){}p=void 0}if(p)return!0}return!1},a:function(a){throw"exit("+a+")";},g:function(){return 0},c:function(){},b:function(a,g,h,e){for(var p=0,q=0;q<h;q++){for(var M=
z[g+8*q>>2],G=z[g+(8*q+4)>>2],u=0;u<G;u++){var c=A[M+u],v=L[a];if(0===c||10===c){c=v;for(var f=0,k=f+NaN,m=f;c[m]&&!(m>=k);)++m;if(16<m-f&&c.subarray&&E)c=E.decode(c.subarray(f,m));else{for(k="";f<m;){var d=c[f++];if(d&128){var w=c[f++]&63;if(192==(d&224))k+=String.fromCharCode((d&31)<<6|w);else{var H=c[f++]&63;d=224==(d&240)?(d&15)<<12|w<<6|H:(d&7)<<18|w<<12|H<<6|c[f++]&63;65536>d?k+=String.fromCharCode(d):(d-=65536,k+=String.fromCharCode(55296|d>>10,56320|d&1023))}}else k+=String.fromCharCode(d)}c=
k}(1===a?l:n)(c);v.length=0}else v.push(c)}p+=G}z[e>>2]=p;return 0},memory:F,d:function(){},table:J}}).then(function(a){a=(a.exports||a.instance.exports);D=a.i;C=a.j;y=a.l;r=a.m;t=a.n;x=a.o;a.h()});


  return {}
}
export default Module;