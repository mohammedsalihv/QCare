const { chromium } = require('C:/Users/salih/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawn } = require('node:child_process');
const Department = require('../server/models/department');
(async () => {
 const root = path.resolve(__dirname, '..');
 const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5199','--strictPort'], {cwd:path.join(root,'client'),windowsHide:true,stdio:['ignore','pipe','pipe']});
 let browser;
 try {
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Vite not ready')),20000);server.stdout.on('data',chunk=>{if(chunk.toString().includes('ready in')){clearTimeout(timer);resolve();}});server.once('error',reject);});
  browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  const departments=[{_id:'department-1',name:'Quality',code:'QUAL',head:'Test Doctor',location:'Main Campus (MAIN)',employeesCount:22}];
  const writes=[];const errors=[];
  await context.route('**/socket.io/**',route=>route.abort());
  await context.route('**/api/**',async route=>{
   const url=new URL(route.request().url());const method=route.request().method();
   if(url.pathname==='/api/departments'&&method==='GET')return route.fulfill({json:departments});
   if(url.pathname==='/api/departments'&&method==='POST'){
    const body=route.request().postDataJSON();await new Department(body).validate();writes.push(body);departments.push({...body,_id:'department-2'});return route.fulfill({status:201,json:departments.at(-1)});
   }
   if(url.pathname==='/api/departments/department-1'&&method==='PUT'){
    const body=route.request().postDataJSON();await new Department(body).validate();writes.push(body);Object.assign(departments[0],body);return route.fulfill({json:departments[0]});
   }
   if(url.pathname==='/api/locations')return route.fulfill({json:[{_id:'location-1',name:'Main Campus',code:'MAIN'}]});
   if(url.pathname==='/api/users/directory')return route.fulfill({json:[{_id:'user-1',employeeName:'Test Doctor',employeeId:'EMP-1',designation:'Physician',department:'Medicine'}]});
   return route.fulfill({json:[]});
  });
  await context.addInitScript(()=>localStorage.setItem('userInfo',JSON.stringify({_id:'department-test',employeeName:'Department Tester',role:'admin',token:'fixture-only'})));
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:5199/dashboard/departments');await page.getByRole('cell',{name:'Quality',exact:true}).waitFor();
  assert.deepEqual(await page.getByRole('columnheader').allTextContents(),['Department Name','Head of Department','Location','Actions']);
  assert.equal(await page.getByText('22 Members',{exact:true}).count(),0);
  await page.getByRole('button',{name:'Add New Department',exact:true}).click();
  assert.equal(await page.locator('input[name="code"]').count(),0);
  await page.locator('input[name="name"]').fill('New Department');
  await page.getByRole('combobox',{name:'Department head',exact:true}).click();await page.getByRole('option',{name:'Test Doctor',exact:true}).click();
  await page.locator('form').getByRole('combobox').nth(1).click();await page.getByRole('option',{name:'Main Campus (MAIN)',exact:true}).click();
  await page.getByRole('button',{name:'Establish Department',exact:true}).click();await page.getByRole('cell',{name:'New Department',exact:true}).waitFor();
  assert.match(writes[0].code,/^DEPT-[a-f0-9]{32}$/);assert.equal(writes[0].head,'Test Doctor');
  await page.getByRole('row').filter({has:page.getByRole('cell',{name:'Quality',exact:true})}).getByRole('button').first().click();
  assert.equal(await page.locator('input[name="code"]').count(),0);await page.locator('input[name="name"]').fill('Quality Updated');
  await page.getByRole('button',{name:'Update Structural Unit',exact:true}).click();await page.getByRole('cell',{name:'Quality Updated',exact:true}).waitFor();assert.equal(writes[1].code,'QUAL');
  await page.getByLabel('Search departments').fill('New Department');assert.equal(await page.getByRole('cell',{name:'Quality Updated',exact:true}).count(),0);assert.equal(await page.getByRole('cell',{name:'New Department',exact:true}).count(),1);
  assert.deepEqual(errors,[]);console.log('PASS: department code and staff count removed, add/edit forms have no code field, new departments send a valid generated internal code, existing codes are preserved, and name search works. Payloads validated against the current backend model; no live data changed.');
 } finally {if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
