const {test}=require('node:test');const assert=require('node:assert/strict');const mongoose=require('mongoose');
const User=require('../models/users'),Location=require('../models/Location'),Department=require('../models/department'),Incident=require('../models/Incident'),Notification=require('../models/Notification');
const {validateIncidentReport}=require('../utils/incidentReport');const {createIncident}=require('../controllers/incidentController');
const id=new mongoose.Types.ObjectId();const body={title:'Test incident',description:'Test details',category:'Clinical',location:'Branch',dateOfIncident:'2025-01-01T12:00:00+04:00',severity:'Low'};
test('incident validation and parallel creation preserve unique codes and attachments',async t=>{
 t.mock.method(require('../models/IncidentRouting'),'findOne',()=>({lean:async()=>null})); t.mock.method(Department,'find',()=>({lean:async()=>[]}));
 t.mock.method(User,'countDocuments',async q=>q._id.$in.length);t.mock.method(Location,'findById',async()=>({_id:id,name:'Branch',isActive:true}));t.mock.method(Department,'exists',async()=>true);
 const file={originalname:'photo.png',buffer:Buffer.from('test'),size:4};
 const report=await validateIncidentReport({...body,branch:String(id),department:'Medicine',involvedStaff:[String(id)],notifyStaff:[String(id)],harmLevel:'No harm'},[file]);assert.equal(report.location,'Branch');assert.equal(report.attachments.length,1);
 for(const category of ['Clinical','Safety','Administrative','Technical','Other']) {
   const details=await validateIncidentReport({...body,category,areaRoom:'Reception corridor'},[]);
   assert.equal(details.areaRoom,'Reception corridor');
 }
 const complete={...body,branch:String(id),department:'Medicine',harmLevel:'No harm',notifyChoice:'Yes',notifyStaff:[String(id)]};
 assert.equal((await validateIncidentReport(complete,[])).notifyChoice,'Yes');
 for(const patch of [{notifyStaff:[]},{notifyChoice:'No'},{department:''},{branch:''},{harmLevel:''}]) await assert.rejects(validateIncidentReport({...complete,...patch},[]));
 for(const patch of [{dateOfIncident:'bad'},{dateOfIncident:'2999-01-01'},{branch:'invalid'},{harmLevel:'invalid'},{notifyStaff:['invalid']}])await assert.rejects(validateIncidentReport({...body,...patch},[]));
 await assert.rejects(validateIncidentReport(body,[{...file,originalname:'script.exe'}]));await assert.rejects(validateIncidentReport(body,[{...file,size:13*1024*1024}]));
 const saved=[];t.mock.method(Incident,'create',async data=>{const doc=new Incident(data);await doc.validate();saved.push(doc);return doc;});t.mock.method(Notification,'create',async data=>data);
 const outputs=await Promise.all(Array.from({length:20},async()=>{let code,result;await createIncident({body,files:[file],user:{_id:id,employeeName:'Test reporter'}},{status(n){code=n;return this;},json(v){result=v;}});assert.equal(code,201);assert.equal(result.attachments[0].data,undefined);return result.incidentId;}));
 assert.equal(new Set(outputs).size,20);assert(saved.every(row=>row.attachments[0].data.length===4));
});
