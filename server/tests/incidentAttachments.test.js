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
const Department = require('../models/department');
const Specialty = require('../models/Specialty');
const Location = require('../models/Location');

// An isolated local MongoDB process. Never connects to the application's database.
test('incident attachments persist and enforce reporter and recipient access', { timeout: 120000 }, async () => {
  const mongod = process.env.QCARE_TEST_MONGOD || 'C:/Program Files/MongoDB/Server/8.2/bin/mongod.exe';
  await fs.access(mongod);
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'qcare-incident-files-test-'));
  const database = spawn(mongod, ['--dbpath', directory, '--port', '27985', '--bind_ip', '127.0.0.1', '--quiet'], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let databaseOutput = '';
  database.stdout.on('data', chunk => { databaseOutput = (databaseOutput + chunk).slice(-12000); });
  database.stderr.on('data', chunk => { databaseOutput = (databaseOutput + chunk).slice(-12000); });
  const exited = new Promise(resolve => database.once('exit', resolve));
  let server;
  try {
    // Wait for this newly spawned process, not a pre-existing server on the port.
    for (let attempt = 0; attempt < 150 && !databaseOutput.includes('Waiting for connections'); attempt++) {
      if (database.exitCode !== null) throw new Error('Isolated MongoDB failed to start: ' + databaseOutput);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert(databaseOutput.includes('Waiting for connections'), 'Isolated MongoDB must be ready');
    await mongoose.connect('mongodb://127.0.0.1:27985/qcare_incident_files_test', { serverSelectionTimeoutMS: 5000 });
    await Specialty.init();
    const admin = await User.create({ employeeId: 'TEST-ADMIN', employeeName: 'Test Admin', email: 'admin@test.invalid', password: 'test-password-only', role: 'admin', department: 'Quality', designation: 'Administrator' });
    const staff = await User.create({ employeeId: 'TEST-DOCTOR', employeeName: 'Test Doctor', email: 'doctor@test.invalid', password: 'test-password-only', role: 'Staff', department: 'Medicine', designation: 'Physician' });
    const inactive = await User.create({ employeeId: 'TEST-INACTIVE', employeeName: 'Inactive Staff', email: 'inactive@test.invalid', password: 'test-password-only', role: 'Staff', department: 'Medicine', designation: 'Nurse', status: 'inactive' });

    const app=express();app.use(express.json());app.use('/api/incidents',require('../routes/incidentRoutes'));
    server=await new Promise(resolve=>{const listener=app.listen(0,'127.0.0.1',()=>resolve(listener));});
    const base='http://127.0.0.1:'+server.address().port+'/api/incidents';
    const headers=user=>({Authorization:'Bearer '+jwt.sign({id:user._id},process.env.JWT_SECRET||'default_secret')});
    const stranger=await User.create({employeeId:'STRANGER',employeeName:'Other Staff',email:'other@test.invalid',password:'test-password-only',role:'Staff',department:'Medicine',designation:'Physician'});
    const branch = await Location.create({ name: 'Test branch', code: 'TEST-BRANCH' });
    await Department.create({ name: 'Test department', code: 'TEST-DEPT', isActive: true });
    const form=new FormData();form.append('payload',JSON.stringify({title:'Attachment test',description:'Complete incident narrative',category:'Clinical',branch:String(branch._id),department:'Test department',areaRoom:'Treatment room 2',dateOfIncident:'2025-01-01T09:30:00+04:00',severity:'High',harmLevel:'No harm',witnesses:'Fictional witness statement',immediateActions:'Device isolated',involvedStaff:[String(staff._id)],notifyChoice:'Yes',notifyStaff:[String(staff._id)]}));form.append('attachments',new Blob(['test evidence']), 'evidence.txt');
    form.append('attachments',new Blob(['synthetic image fixture']), 'scene.png');
    form.append('attachments',new Blob(['synthetic video fixture']), 'scene.mp4');
    const created=await fetch(base,{method:'POST',headers:headers(admin),body:form});assert.equal(created.status,201);const row=await created.json();assert.equal(row.attachments[0].data,undefined);
    assert.match(row.incidentId, /^INC-[2-9A-HJ-NP-Z]{8}$/);
    const detail = await (await fetch(base+'/'+row._id,{headers:headers(admin)})).json();
    const saved = detail.row || detail;
    for(const [key,value] of Object.entries({location:'Test branch',department:'Test department',areaRoom:'Treatment room 2',witnesses:'Fictional witness statement',immediateActions:'Device isolated',harmLevel:'No harm',notifyChoice:'Yes',description:'Complete incident narrative'})) assert.equal(saved[key],value,key);
    assert.equal(saved.involvedStaff[0].employeeName,'Test Doctor');
    assert.equal(saved.notifyStaff[0].employeeName,'Test Doctor');
    assert.equal(saved.attachments.length,3);
    assert.equal((await (await fetch(base+'/register?search='+encodeURIComponent(row.incidentId),{headers:headers(admin)})).json()).total,1);
    await require('../models/Incident').updateOne({_id:row._id},{$addToSet:{previousIncidentIds:'INC-OLD-REFERENCE'}});
    assert.equal((await (await fetch(base+'/register?search=INC-OLD-REFERENCE',{headers:headers(admin)})).json()).total,1);
    const url=base+'/'+row._id+'/attachments/'+row.attachments[0]._id;
    const download=await fetch(url,{headers:headers(staff)});assert.equal(download.status,200);assert.equal(await download.text(),'test evidence');assert.match(download.headers.get('content-disposition'),/^attachment/);
    assert.equal((await fetch(url,{headers:headers(stranger)})).status,404);assert.equal((await fetch(url)).status,401);
    const listed=await (await fetch(base,{headers:headers(staff)})).json();assert.equal(listed.length,1);assert.equal(listed[0].attachments[0].data,undefined);
    assert.equal((await (await fetch(base,{headers:headers(stranger)})).json()).length,0);
  } finally {
    if(server)await new Promise(resolve=>server.close(resolve));await mongoose.disconnect();database.kill();await exited;
    const resolved=path.resolve(directory);assert.equal(path.dirname(resolved).toLowerCase(),path.resolve(os.tmpdir()).toLowerCase());assert(path.basename(resolved).startsWith('qcare-incident-files-test-'));await fs.rm(resolved,{recursive:true,force:true});
  }
});

