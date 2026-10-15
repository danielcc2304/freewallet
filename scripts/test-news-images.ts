import assert from 'node:assert/strict';
import {readPublicGooglePhoto,handleImportNewsImage,isGooglePhotoShare,imageFormat,MAX_IMAGE_BYTES} from '../supabase/functions/import-news-image/handler';

const short='https://photos.app.goo.gl/TestPublicPhoto123';
const shared='https://photos.google.com/share/example?key=public-key';
const jpeg=new Uint8Array([255,216,255,224,0,16,74,70,73,70]);
const html='<meta content="https://lh3.googleusercontent.com/pw/test=w600-h315-p-k" property="og:image">';
let requests:string[]=[];let uploads=0;
const fetcher:typeof fetch=async(input,init)=>{
    const url=String(input);requests.push(url);assert.equal(init?.redirect,'manual');
    if(url===short)return new Response(null,{status:302,headers:{location:shared}});
    if(url===shared)return new Response(html,{headers:{'content-type':'text/html'}});
    assert.equal(url,'https://lh3.googleusercontent.com/pw/test=w1920');return new Response(jpeg,{headers:{'content-type':'image/jpeg'}});
};
assert.ok(isGooglePhotoShare(short));assert.ok(isGooglePhotoShare(shared));
for(const value of ['http://photos.app.goo.gl/a','https://photos.app.goo.gl.evil.test/a','https://user:pass@photos.app.goo.gl/a','https://photos.google.com/lr/photo/private','https://127.0.0.1/image','javascript:alert(1)'])assert.equal(isGooglePhotoShare(value),false,value);
assert.deepEqual(imageFormat(jpeg),{mime:'image/jpeg',extension:'jpg'});
assert.equal(imageFormat(new TextEncoder().encode('<svg onload=alert(1)>')),null);
const result=await readPublicGooglePhoto(short,fetcher);assert.deepEqual(result.bytes,jpeg);assert.equal(requests.length,3);
await assert.rejects(readPublicGooglePhoto(short,async()=>new Response(null,{status:302,headers:{location:'http://169.254.169.254/latest'}})),/no corresponde/);
await assert.rejects(readPublicGooglePhoto(short,async()=>new Response(null,{status:302,headers:{location:shared}})),/demasiadas/);
await assert.rejects(readPublicGooglePhoto(shared,async()=>new Response('<meta property="og:image" content="https://evil.test/pic">',{headers:{'content-type':'text/html'}})),/No se encontró/);
await assert.rejects(readPublicGooglePhoto(shared,async input=>String(input)===shared?new Response(html,{headers:{'content-type':'text/html'}}):new Response('<html>not an image</html>',{headers:{'content-type':'image/jpeg'}})),/Formato/);
await assert.rejects(readPublicGooglePhoto(shared,async input=>String(input)===shared?new Response(html,{headers:{'content-type':'text/html'}}):new Response(jpeg,{headers:{'content-type':'image/jpeg','content-length':String(MAX_IMAGE_BYTES+1)}})),/tamaño/);
await assert.rejects(readPublicGooglePhoto(shared,async()=>new Response('x'.repeat(2*1024*1024+1),{headers:{'content-type':'text/html'}})),/tamaño/);
const deps={authorize:async()=> 'editor',upload:async(user:string,bytes:Uint8Array,mime:string)=>{assert.equal(user,'editor');assert.equal(mime,'image/jpeg');assert.deepEqual(bytes,jpeg);uploads++;return 'https://example.supabase.co/storage/v1/object/public/news-images/editor/test.jpg';},fetcher};
const req=(body:unknown,token=true)=>new Request('https://local/import-news-image',{method:'POST',headers:token?{Authorization:'Bearer synthetic'}:{},body:JSON.stringify(body)});
assert.equal((await handleImportNewsImage(req({url:short},false),deps)).status,401);
assert.equal((await handleImportNewsImage(req({url:short}),{...deps,authorize:async()=>null})).status,403);
assert.equal(uploads,0);
assert.equal((await handleImportNewsImage(req({url:'https://example.com/image'}),deps)).status,400);
assert.equal((await handleImportNewsImage(req({url:short}),deps)).status,200);assert.equal(uploads,1);
assert.equal((await handleImportNewsImage(new Request('https://local',{method:'OPTIONS'}),deps)).status,200);
assert.equal((await handleImportNewsImage(new Request('https://local'),deps)).status,405);
// Optional read-only validation against the actual public link; does not upload anything.
if(process.env.FREEWALLET_TEST_GOOGLE_PHOTO){requests=[];const live=await readPublicGooglePhoto(process.env.FREEWALLET_TEST_GOOGLE_PHOTO);console.log('Live public Google photo:',live.mime,live.bytes.length,'bytes');assert.ok(live.bytes.length>100);}
console.log('PASS: Google Photos redirect/metadata resolution, aspect ratio, binary validation, size limits, SSRF rejection and editorial authorization.');
