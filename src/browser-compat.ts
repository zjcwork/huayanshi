// `crypto.randomUUID` is restricted to secure contexts in some browsers.
// The deployed demo is served from an internal HTTP address, so install a
// standards-shaped UUID v4 fallback while retaining the native implementation
// whenever it is available.
if(!globalThis.crypto.randomUUID){
 Object.defineProperty(globalThis.crypto,'randomUUID',{
  configurable:true,
  value:()=>{
   const bytes=globalThis.crypto.getRandomValues(new Uint8Array(16));
   bytes[6]=(bytes[6]&0x0f)|0x40;
   bytes[8]=(bytes[8]&0x3f)|0x80;
   const hex=Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('');
   return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  },
 });
}
