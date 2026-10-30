const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{spawn}=require('node:child_process');
const {chromium}=require('C:/Users/salih/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=process.cwd(), user={_id:'507f1f77bcf86cd799439011',employeeName:'Requesting user',role:'Quality',token:'fixture-token'};
let feed=[];
const notice=(id,status,reason='')=>({_id:id,type:'system_alert',message:'Clinic review: '+status,user:'Quality Reviewer',createdAt:'2026-10-30T07:30:00Z',isRead:false,workflow:{module:'Audit schedule',recordId:'507f1f77bcf86cd799439012',title:'Clinic review',status,reason,actor:{name:'Quality Reviewer'},requester:{name:'Requesting user'},occurredAt:status === 'Rejected' ? '2026-10-30T08:00:00Z' : status === 'Approved' ? '2026-10-30T07:30:00Z' : '2026-10-30T07:00:00Z'}});
(async()=>{
const vite=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5198','--strictPort'],{cwd:path.join(root,'client'),windowsHide:true,stdio:['ignore','pipe','pipe']});let browser;
try{
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Vite startup timeout')),30000);vite.stdout.on('data',d=>{if(d.toString().includes('ready in')){clearTimeout(timer);resolve();}});vite.on('error',reject);});
 browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const context=await browser.newContext({viewport:{width:1365,height:950}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(u=>{localStorage.setItem('userInfo',JSON.stringify(u));window.__notes=0;window.AudioContext=class{constructor(){this.state='suspended';this.currentTime=0;}resume(){this.state='running';return Promise.resolve();}createOscillator(){return{frequency:{value:0},connect(){},start(){window.__notes++;},stop(){}};}createGain(){return{gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}};},user);
 await context.route('**/socket.io/**',r=>r.abort());
 await context.route('**/api/**',r=>r.fulfill({json:r.request().url().includes('/notifications')?feed:[]}));
 feed=[notice('first','Awaiting approval')];
 await page.goto('http://127.0.0.1:5198/notifications');
 await page.getByRole('button',{name:'Notification sound on',exact:true}).waitFor();
 await page.getByText('Requested by',{exact:false}).first().waitFor();
 assert.equal(await page.evaluate(()=>window.__notes),0,'Existing notifications load silently');
 await page.getByRole('heading',{name:/Notification/i}).first().click();
 feed=[notice('approved','Approved'),...feed];await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await page.waitForFunction(()=>window.__notes===2);
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.waitForTimeout(250);
 assert.equal(await page.evaluate(()=>window.__notes),2,'Polling cannot replay a notification chime');
 await page.getByRole('button',{name:'Notification sound on',exact:true}).click();
 feed=[notice('rejected','Rejected','Please revise the visit dates'),...feed];await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await page.getByText('Reason / comment:',{exact:false}).first().waitFor();assert.equal(await page.evaluate(()=>window.__notes),2,'Muted notifications remain silent');
 await page.locator('summary').first().click();await page.getByText('Process log · Dubai time',{exact:false}).first().waitFor();
 await page.screenshot({path:path.join(root,'output/clinical-audit-verification/notification-workflow-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Notification history must fit mobile');
 await page.screenshot({path:path.join(root,'output/clinical-audit-verification/notification-workflow-mobile.png'),fullPage:true});
 await page.getByRole('button',{name:'Awaiting action',exact:true}).click();await page.getByRole('heading',{name:'No notifications found',exact:true}).waitFor();
 await page.getByRole('button',{name:'All Activities',exact:true}).click();
 await page.reload();await page.getByRole('button',{name:'Notification sound off',exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.__notes),0);
 assert.deepEqual(errors,[]);console.log('Notification browser checks passed: actor/requester/time/reason/history, first-load silence, single new-event chime, polling deduplication, persistent mute, and mobile layout.');
}finally{if(browser)await browser.close();vite.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
