const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const License = require('../models/ClinicalStaffLicense');
const Notification = require('../models/Notification');
const { licenseStatus } = require('../utils/clinicalLicenseStatus');
const { sendClinicalLicenseReminders } = require('../scheduledJobs/clinicalLicenseReminder');

test('expiry boundaries include the full expiry date', () => {
  const now = new Date('2026-11-02T23:59:59Z');
  assert.equal(licenseStatus('2026-11-01', now), 'Expired');
  assert.equal(licenseStatus('2026-11-02', now), 'Expiring soon');
  assert.equal(licenseStatus('2027-01-31', now), 'Expiring soon');
  assert.equal(licenseStatus('2027-02-01', now), 'Active');
});

test('clinical licences persist, authorize, renew, verify, protect certificates and deduplicate reminders', { timeout: 120000 }, async () => {
  const mongod = process.env.QCARE_TEST_MONGOD || 'C:/Program Files/MongoDB/Server/8.2/bin/mongod.exe';
  await fs.access(mongod);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'qcare-clinical-license-test-'));
  const database = spawn(mongod, ['--dbpath', directory, '--port', '27984', '--bind_ip', '127.0.0.1', '--quiet'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  database.stdout.on('data', b => { output = (output+b).slice(-12000); });
  database.stderr.on('data', b => { output = (output+b).slice(-12000); });
  const exited = new Promise(resolve => database.once('exit', resolve));
  let server;
  try {
    for(let i=0;i<150&&!output.includes('Waiting for connections');i++) {
      if(database.exitCode!==null)throw Error('Isolated database did not start: '+output);
      await new Promise(r=>setTimeout(r,100));
    }
    assert(output.includes('Waiting for connections'));
    await mongoose.connect('mongodb://127.0.0.1:27984/qcare_clinical_license_test', { serverSelectionTimeoutMS: 5000 });
    await Promise.all([License.init(),Notification.init()]);
    const makeUser=(id,role='Staff')=>User.create({employeeId:id,employeeName:id,email:id+'@test.invalid',password:'test-only-password',role,department:'Nursing',designation:'Clinical staff'});
    const admin=await makeUser('admin','admin'), nurse=await makeUser('nurse'), doctor=await makeUser('doctor'), quality=await makeUser('quality','QualityManager');
    const app=express();app.use(express.json());app.use('/api/licences',require('../routes/clinicalStaffLicenseRoutes'));
    server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
    const base='http://127.0.0.1:'+server.address().port+'/api/licences';
    const headers=user=>user?{Authorization:'Bearer '+jwt.sign({id:user._id},process.env.JWT_SECRET||'default_secret')}:{};
    const req=async(url='',user=admin,method='GET',body)=>{const r=await fetch(base+url,{method,headers:{...headers(user),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,body:await r.json()};};
    const payload={staff:String(nurse._id),profession:'Nurse',authority:'DOH',category:'Registered Nurse',licenseNumber:'RN-001',issuedDate:'2025-01-01',expiryDate:'2027-01-01'};
    assert.equal((await req('',null)).status,401);
    assert.equal((await req('',nurse,'POST',payload)).status,403);
    const created=await req('',admin,'POST',payload);assert.equal(created.status,201);const id=created.body._id;
    assert.equal((await req('',admin,'POST',payload)).status,409);
    for(const patch of [{issuedDate:'2026-02-30'},{expiryDate:'2024-01-01'},{profession:'invalid'},{staff:'bad'}])assert.equal((await req('',admin,'POST',{...payload,...patch})).status,400);
    assert.equal((await req('',quality,'POST',{...payload,staff:String(doctor._id),profession:'Doctor',licenseNumber:'DR-002',category:'Consultant'})).status,201);
    assert.equal((await req('',admin,'POST',{...payload,licenseNumber:'RN-003',authority:'DHA'})).status,201);
    assert.equal((await req('',nurse)).body.total,2);
    assert.equal((await req('',doctor)).body.total,1);
    const first=await req('?limit=1&sortBy=name'),second=await req('?limit=1&page=2');assert.equal(first.body.total,3);assert.notEqual(first.body.items[0]._id,second.body.items[0]._id);
    assert.equal((await req('?profession=Nurse')).body.total,2);
    assert.equal((await req('?search=RN-001')).body.total,1);
    assert.equal((await req('?search=.*')).body.total,0);
    assert.equal((await req('?search=doctor',nurse)).body.total,0);
    for(const query of ['limit=101','sortBy=password','status=bad','profession=bad'])assert.equal((await req('?'+query)).status,400);
    assert.equal((await req('/'+id+'/history',doctor)).status,404);
    assert.equal((await req('/'+id+'/review',nurse,'POST',{verification:'Verified'})).status,403);
    assert.equal((await req('/'+id+'/review',admin,'POST',{verification:'Rejected',remarks:''})).status,400);
    const self=await req('',admin,'POST',{...payload,staff:String(admin._id),licenseNumber:'ADMIN-001'});
    assert.equal((await req('/'+self.body._id+'/review',admin,'POST',{verification:'Verified'})).status,403);
    const upload=async(data,user=admin)=>{const f=new FormData();f.append('certificate',new Blob([data]),'test.pdf');const r=await fetch(base+'/'+id+'/certificate',{method:'POST',headers:headers(user),body:f});return {status:r.status,body:await r.json()};};
    assert.equal((await upload('<html>bad</html>')).status,400);
    assert.equal((await upload('%PDF-1.4\nexample',nurse)).status,403);
    const cert=await upload('%PDF-1.4\nexample');assert.equal(cert.status,200);
    const url=base+'/'+id+'/certificate/'+cert.body.certificateId;
    assert.equal((await fetch(url,{headers:headers(doctor)})).status,404);
    assert.equal((await fetch(url)).status,401);
    const downloaded=await fetch(url,{headers:headers(nurse)});assert.equal(downloaded.status,200);assert.equal(downloaded.headers.get('content-type'),'application/pdf');assert.match(downloaded.headers.get('content-disposition'),/^attachment/);assert.equal(await downloaded.text(),'%PDF-1.4\nexample');
    const tooBig=Buffer.alloc(5*1024*1024+1,32);tooBig.write('%PDF-');assert.equal((await upload(tooBig)).status,400);
    assert.equal((await req('/'+id+'/review',quality,'POST',{verification:'Verified',remarks:'Checked registration'})).status,200);
    assert.equal((await req('?status=Verified')).body.total,1);
    assert.equal((await req('/'+id+'/review',admin,'POST',{verification:'Verified'})).status,409);
    assert.equal((await req('/'+id+'/renew',admin,'POST',{licenseNumber:'RN-001',issuedDate:'2026-01-01',expiryDate:'2027-01-01'})).status,400);
    const renewed=await req('/'+id+'/renew',admin,'POST',{licenseNumber:'RN-001',issuedDate:'2027-01-01',expiryDate:'2028-01-01'});
    assert.equal(renewed.status,200);assert.equal(renewed.body.verification,'Pending');assert.equal(renewed.body.certificateId,undefined);
    const history=await req('/'+id+'/history?limit=1&direction=desc');assert.equal(history.body.total,3);assert.equal(history.body.items[0].event,'Renewed');assert.equal(history.body.items[0].certificateId,cert.body.certificateId);assert.equal(history.body.items[0].verification,'Verified');
    assert.equal((await fetch(url,{headers:headers(nurse)})).status,200,'old certificate remains downloadable');
    const edited=await req('/'+id,admin,'PUT',{...payload,category:'Senior Nurse',expiryDate:'2028-01-01'});assert.equal(edited.status,200);
    assert.equal((await req('/'+id+'/history?search=Edited')).body.total,1);
    // Isolated fixture updates only: exercise each reminder boundary and deduplication.
    await License.deleteMany({_id:{$ne:id}});
    await License.updateOne({_id:id},{$set:{expiryDate:new Date('2026-12-01')}});
    assert.equal(await sendClinicalLicenseReminders(new Date('2026-09-02')),1);
    assert.equal(await sendClinicalLicenseReminders(new Date('2026-09-03')),0);
    assert.equal(await sendClinicalLicenseReminders(new Date('2026-11-01')),1);
    assert.equal(await sendClinicalLicenseReminders(new Date('2026-11-24')),1);
    assert.equal(await sendClinicalLicenseReminders(new Date('2026-12-01')),1);
    assert.equal(await sendClinicalLicenseReminders(new Date('2026-12-02')),1);
    assert.equal(await sendClinicalLicenseReminders(new Date('2026-12-03')),0);
    const visibility=require('../utils/notificationVisibility');
    assert.equal(await Notification.countDocuments(visibility(nurse)),5);
    assert.equal(await Notification.countDocuments(visibility(doctor)),0);
    assert.equal(await Notification.countDocuments(visibility(admin)),5);
    assert.equal(await Notification.countDocuments(visibility(quality)),5);
  } finally {
    if(server)await new Promise(resolve=>server.close(resolve));
    await mongoose.disconnect();database.kill();await exited;
    const resolved=path.resolve(directory);assert.equal(path.dirname(resolved).toLowerCase(),path.resolve(os.tmpdir()).toLowerCase());assert(path.basename(resolved).startsWith('qcare-clinical-license-test-'));await fs.rm(resolved,{recursive:true,force:true});
  }
});
