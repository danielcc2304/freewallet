import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import puppeteer from 'puppeteer';

const origin=process.env.FREEWALLET_TEST_URL??'http://127.0.0.1:5186';
assert.match(origin,/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const version=JSON.parse(readFileSync('package.json','utf8')).version;
const reader='11111111-1111-4111-8111-111111111111';const editor='22222222-2222-4222-8222-222222222222';
const postId='33333333-3333-4333-8333-333333333333';const stamp='2026-10-15T12:00:00.000Z';
const article={id:postId,slug:'analisis-de-prueba',title:'Perspectivas de mercado y decisiones de inversión a largo plazo',excerpt:'Un análisis de ejemplo para comprobar la lectura y la distribución de las noticias.',content:`<p>Contenido de prueba con enlaces y párrafos.</p><p>${'Largo'.repeat(75)}</p><pre><code>${'codigo'.repeat(100)}</code></pre>`,cover_image_url:null,status:'published',author_id:editor,published_at:stamp,created_at:stamp,updated_at:stamp};
const user=(id:string)=>({id,email:'fixture@example.invalid',email_confirmed_at:stamp,aud:'authenticated',role:'authenticated',is_anonymous:false,app_metadata:{},user_metadata:{username:'lector'},created_at:stamp,factors:[]});
const session=(id:string)=>({access_token:`${Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url')}.${Buffer.from(JSON.stringify({sub:id,aal:'aal1',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.c3ludGhldGlj`,refresh_token:'synthetic',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user:user(id)});
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
try{
    for(const scenario of (['visitor','reader','editor','owner'] as const).filter(scenario=>!process.env.FREEWALLET_NEWS_SCENARIO||process.env.FREEWALLET_NEWS_SCENARIO===scenario)){
        const context=await browser.createBrowserContext();const page=await context.newPage();page.setDefaultNavigationTimeout(60000);page.setDefaultTimeout(60000);
        await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
        const errors:string[]=[];page.on('pageerror',error=>errors.push(String(error)));
        const identity=scenario==='visitor'?null:(scenario==='editor'||scenario==='owner')?editor:reader;
        let entries=[{id:'44444444-4444-4444-8444-444444444444',body:'Un comentario de otro lector. <img src=x onerror=alert(1)>',username:'otro_lector',createdAt:stamp,updatedAt:stamp,canEdit:false,canDelete:scenario==='editor'||scenario==='owner'}];
        let nextPage=true;let createCount=0;let edits=0;let deletes=0;let logouts=0;let rejectPost=false;
        await page.evaluateOnNewDocument((auth,v)=>{if(auth)localStorage.setItem('freewallet-news-auth',JSON.stringify(auth));localStorage.setItem('freewallet_settings','{"apiEnabled":false}');localStorage.setItem('freewallet_last_seen_version',v);},identity?session(identity):null,version);
        await page.setRequestInterception(true);
        page.on('request',request=>{void(async()=>{
            const url=new URL(request.url());
            if(url.hostname.endsWith('.supabase.co')){
                const headers={'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,PATCH,DELETE,OPTIONS','access-control-allow-headers':request.headers()['access-control-request-headers']??'*'};
                if(request.method()==='OPTIONS'){await request.respond({status:204,headers});return;}
                const body=JSON.parse(request.postData()??'{}');let data:unknown=null;let status=200;
                if(url.pathname==='/auth/v1/user')data=user(identity??reader);
                else if(url.pathname==='/auth/v1/logout'){logouts++;data={};}
                else if(url.pathname==='/rest/v1/news_posts')data=url.searchParams.has('slug')?article:[article,{...article,id:'55555555-5555-4555-8555-555555555555',slug:'segundo-analisis',title:'Una noticia con un título especialmente largo para revisar el listado en pantallas pequeñas'}];
                else if(url.pathname==='/rest/v1/news_admins')data=scenario==='owner'?[{user_id:editor,email:'owner@example.invalid',role:'owner',status:'active',created_at:stamp},{user_id:reader,email:'a-very-long-editor-address-to-check-layout@example.invalid',role:'editor',status:'invited',created_at:stamp}]:[];
                else if(url.pathname.endsWith('/rpc/is_news_admin'))data=scenario==='editor'||scenario==='owner';
                else if(url.pathname.endsWith('/rpc/is_news_owner')||url.pathname.endsWith('/rpc/ensure_news_owner'))data=scenario==='owner';
                else if(url.pathname.endsWith('/rpc/has_pending_news_invitation'))data=false;
                else if(url.pathname.endsWith('/rpc/list_news_comments')){
                    if(body.before_id){data={items:[{...entries[0],id:'66666666-6666-4666-8666-666666666666',body:'Un comentario anterior.'}],nextCursor:null};nextPage=false;}
                    else data={items:entries,nextCursor:nextPage?{createdAt:stamp,id:entries.at(-1)?.id}:null};
                }else if(url.pathname.endsWith('/rpc/create_news_comment')){
                    createCount++;assert.equal(body.expected_user_id,identity);
                    if(rejectPost){status=429;data={code:'54000',message:'Comment rate limit'};}
                    else{const item={id:body.comment_id,body:body.comment_body,username:'lector',createdAt:stamp,updatedAt:stamp,canEdit:true,canDelete:true};entries=[item,...entries];data=item;}
                }else if(url.pathname.endsWith('/rpc/edit_news_comment')){
                    edits++;assert.equal(body.expected_user_id,identity);entries=entries.map(entry=>entry.id===body.comment_id?{...entry,body:body.comment_body,updatedAt:'2026-10-15T12:00:01.000Z'}:entry);data=entries.find(entry=>entry.id===body.comment_id);
                }else if(url.pathname.endsWith('/rpc/delete_news_comment')){
                    deletes++;assert.equal(body.expected_user_id,identity);entries=entries.filter(entry=>entry.id!==body.comment_id);data=true;
                }else if(!url.pathname.startsWith('/rest/v1/rpc/'))throw new Error(`Unexpected isolated endpoint: ${url.pathname}`);
                await request.respond({status,headers,contentType:'application/json',body:JSON.stringify(data)});
            }else if(url.origin===origin||url.protocol==='data:'||url.protocol==='blob:')await request.continue();else await request.abort();
        })().catch(error=>{errors.push(String(error));if(!request.isInterceptResolutionHandled())void request.abort();});});
        const click=async(text:string)=>{const button=await page.waitForSelector(`button::-p-text(${text})`);assert.ok(button);await button.click();};
        const fit=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${scenario}/${await page.evaluate(()=>innerWidth)}: page overflow`);
        for(const width of [320,390,768,1280,1920]){
            console.log('Checking',scenario,width);await page.setViewport({width,height:1000});await page.goto(`${origin}/news`,{waitUntil:'networkidle2'});await page.waitForSelector('.news-card');
            await fit();
            await page.goto(`${origin}/admin/news`,{waitUntil:'networkidle2'});
            if(scenario==='visitor'){
                await page.waitForSelector('.news-admin__login-card');
                const bounds=await page.$eval('.news-admin__login-card',element=>{const r=element.getBoundingClientRect();const p=element.parentElement!.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,parentLeft:p.left,parentWidth:p.width};});
                assert.ok(Math.abs(bounds.left+bounds.width/2-(bounds.parentLeft+bounds.parentWidth/2))<2,'Editorial login is centered in the content area');
                assert.ok(bounds.width<=500&&bounds.width>200);
            }else if(scenario==='reader'){
                await page.waitForFunction(()=>document.body.innerText.includes('Acceso editorial restringido')).catch(async error=>{await page.screenshot({path:'/tmp/freewallet-news-audit-failure.png'});console.error(await page.evaluate(()=>({url:location.href,body:document.body.innerText,html:document.body.innerHTML.slice(-2500)})),errors);throw error;});assert.equal(logouts,0,'Editorial access never logs out a normal reader');
                assert.ok(await page.evaluate(()=>!!localStorage.getItem('freewallet-news-auth')));
            }else{
                await page.waitForSelector('.rich-text-editor__surface').catch(async error=>{await page.screenshot({path:'/tmp/freewallet-editor-audit-failure.png'});console.error('Editor fixture',await page.evaluate(()=>({url:location.href,body:document.body.innerText,html:document.body.innerHTML.slice(-2500)})),errors);throw error;});
                if(width<=390)assert.ok(await page.$eval('.news-admin__header',element=>element.getBoundingClientRect().height<240),'Mobile header must not reserve a desktop flex basis as empty vertical space');
                if(scenario==='owner')assert.ok(await page.$('.news-admin__team-card'));
                if(width===1920){
                    const grid=await page.$eval('.news-admin__form-grid',element=>{
                        const fields=[...element.querySelectorAll('.input-wrapper')];const slug=fields.find(field=>field.textContent?.startsWith('Slug'))!.getBoundingClientRect();const cover=fields.find(field=>field.textContent?.includes('Imagen de portada'))!.getBoundingClientRect();return {slugTop:slug.top,coverTop:cover.top};
                    });assert.ok(Math.abs(grid.slugTop-grid.coverTop)<2,'Slug and cover use the same desktop row');
                }
            }
            if(scenario==='editor'||scenario==='owner'){
                await page.click('.news-admin__post-select');
                await page.waitForFunction(title=>(document.querySelector('.news-admin__form-grid input') as HTMLInputElement)?.value===title,{},article.title);
                await click('Vista previa');await page.waitForSelector('.news-admin__preview');
                assert.ok(await page.$eval('.modal__content',element=>element.scrollWidth<=element.clientWidth+1),'Article preview contains long text');
                await page.keyboard.press('Escape');
            }
            for(const theme of ['light','dark'])for(const appearance of ['standard','liquid-glass']){
                await page.evaluate((t,a)=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.appearance=a;},theme,appearance);await fit();
            }
            if((scenario==='visitor'||scenario==='editor')&&(width===390||width===1920)){
                await page.evaluate(()=>{document.documentElement.dataset.theme='light';document.documentElement.dataset.appearance='liquid-glass';window.scrollTo({top:0,behavior:'instant'});});
                await page.evaluate(async()=>{await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));await Promise.all(document.getAnimations().filter(animation=>animation.effect?.getComputedTiming().iterations!==Infinity).map(animation=>animation.finished.catch(()=>{})));});
                await page.screenshot({path:`/tmp/freewallet-news-${scenario}-${width}.png`});
            }
        }
        await page.setViewport({width:390,height:1000});await page.goto(`${origin}/news/${article.slug}`,{waitUntil:'networkidle2'});
        await page.waitForSelector('.news-comments__item');assert.equal(await page.$('.news-comments__body img'),null,'Comment HTML must be inert text');
        if(scenario==='visitor'){
            assert.equal(await page.$('#news-comment-body'),null);assert.equal(await page.$('.news-comments__actions'),null);
            assert.ok(await page.$('.news-comments__login a'));
        }else if(scenario==='reader'){
            const compose=await page.waitForSelector('#news-comment-body');assert.ok(compose);await compose.type('Mi comentario de prueba');await click('Publicar comentario');
            await page.waitForFunction(()=>document.body.innerText.includes('Comentario publicado.'));assert.equal(createCount,1);
            await page.click('button[aria-label="Editar comentario de lector"]');await page.type('.news-comments__item textarea',' ampliado');await click('Cancelar');assert.equal(edits,0);
            await page.click('button[aria-label="Editar comentario de lector"]');await page.type('.news-comments__item textarea',' ampliado');await click('Guardar cambios');
            await page.waitForFunction(()=>document.body.innerText.includes('Comentario actualizado.'));assert.equal(edits,1);assert.ok(await page.$eval('.news-comments__list',node=>node.textContent?.includes('ampliado')));
            await page.click('button[aria-label="Eliminar comentario de lector"]');await page.waitForSelector('.confirm-dialog');await page.click('.confirm-dialog button::-p-text(Cancelar)');assert.equal(deletes,0);
            await page.click('button[aria-label="Eliminar comentario de lector"]');await page.waitForSelector('.confirm-dialog');await page.click('.confirm-dialog button::-p-text(Eliminar comentario)');
            await page.waitForFunction(()=>document.body.innerText.includes('Comentario eliminado.')).catch(async error=>{console.error('Deletion fixture',deletes,errors,await page.$eval('.news-comments',element=>element.textContent));throw error;});assert.equal(deletes,1);
            rejectPost=true;await page.type('#news-comment-body','Conservar si falla');await click('Publicar comentario');await page.waitForFunction(()=>document.body.innerText.includes('Espera 20 segundos'));
            assert.equal(await page.$eval('#news-comment-body',element=>(element as HTMLTextAreaElement).value),'Conservar si falla');
            await click('Ver más comentarios');await page.waitForFunction(()=>document.body.innerText.includes('Un comentario anterior.'));assert.equal(await page.$('button::-p-text(Ver más comentarios)'),null);
            await page.reload({waitUntil:'networkidle2'});await page.waitForSelector('.news-comments__item');
        }else{
            assert.equal(await page.$('button[aria-label="Editar comentario de otro_lector"]'),null);
            assert.ok(await page.$('button[aria-label="Eliminar comentario de otro_lector"]'));
            assert.ok(await page.$('.news-article__edit'));
        }
        for(const width of [320,390,768,1280,1920]){
            await page.setViewport({width,height:1000});
            for(const theme of ['light','dark'])for(const appearance of ['standard','liquid-glass']){
                await page.evaluate((t,a)=>{document.documentElement.dataset.theme=t;document.documentElement.dataset.appearance=a;},theme,appearance);await fit();
            }
        }
        await page.setViewport({width:390,height:1000});
        await fit();await page.$eval('.news-comments',element=>element.scrollIntoView({behavior:'instant',block:'start'}));
        await page.screenshot({path:`/tmp/freewallet-news-comments-${scenario}.png`});
        assert.deepEqual(errors,[]);await context.close();
        console.log(`PASS: ${scenario} news list/article/editorial at five widths and all themes, comments permissions and interactions.`);
    }
}finally{await browser.close();}
