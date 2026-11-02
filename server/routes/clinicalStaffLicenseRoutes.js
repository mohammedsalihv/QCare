const express=require('express'), multer=require('multer'), mongoose=require('mongoose');
const {protect}=require('../middleware/authMiddleware');
const License=require('../models/ClinicalStaffLicense'), Certificate=require('../models/ClinicalLicenseCertificate'), User=require('../models/users');
const {listQuery}=require('../utils/listQuery');
const {licenseStatus:status}=require('../utils/clinicalLicenseStatus');
const router=express.Router();
const manager=user=>['admin','SuperAdmin','QualityManager'].includes(user.role);
const fail=(message,status=400)=>{const e=new Error(message);e.status=status;throw e;};
const wrap=fn=>async(req,res)=>{try{await fn(req,res);}catch(e){res.status(e.code===11000||e.name==='VersionError'?409:e.status||400).json({message:e.code===11000?'This authority and licence number already exist.':e.name==='VersionError'?'Record changed. Refresh and retry.':e.status?e.message:'Could not complete the request.'});}};
const manage=(req,res,next)=>manager(req.user)?next():res.status(403).json({message:'Only administrators and quality managers can manage licences.'});
const scope=req=>manager(req.user)?{}:{staff:req.user._id};
const text=(body,key,max,required=true)=>{const v=body[key];if(v===undefined&&!required)return '';if(typeof v!=='string'||v.trim().length>max||(required&&!v.trim()))fail('Enter a valid '+key+'.');return v.trim();};
function dates(body){const result={};for(const key of ['issuedDate','expiryDate']){const v=body[key];if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)fail('Enter valid issue and expiry dates.');result[key]=new Date(v);}if(result.expiryDate<=result.issuedDate)fail('Expiry must be after the issue date.');return result;}
async function record(req){if(!mongoose.isObjectIdOrHexString(req.params.id))fail('Invalid licence ID.');const row=await License.findOne({_id:req.params.id,...scope(req)});if(!row)fail('Licence not found.',404);return row;}
function snapshot(row,user,event){row.history.push({event,profession:row.profession,specialty:row.specialty,authority:row.authority,category:row.category,licenseNumber:row.licenseNumber,issuedDate:row.issuedDate,expiryDate:row.expiryDate,verification:row.verification,remarks:row.remarks,reviewer:row.reviewer,certificateId:row.certificateId,changedBy:user._id,changedAt:new Date()});}
router.use(protect,(req,res,next)=>{res.set('Cache-Control','no-store');next();});
router.get('/',wrap(async(req,res)=>{
 const q=listQuery(req.query,{sorts:{name:'licenseNumber',expiryDate:'expiryDate',authority:'authority',updatedAt:'updatedAt'},statuses:['Active','Expiring soon','Expired','Pending','Verified','Rejected']});const filter=scope(req);
 if(req.query.profession){if(!['Doctor','Nurse','Allied health','Other'].includes(req.query.profession))fail('Invalid profession.');filter.profession=req.query.profession;}
 if(['Pending','Verified','Rejected'].includes(q.status))filter.verification=q.status;
 const today=new Date();today.setUTCHours(0,0,0,0);const soon=new Date(today.getTime()+90*86400000);
 if(q.status==='Expired')filter.expiryDate={$lt:today};if(q.status==='Expiring soon')filter.expiryDate={$gte:today,$lte:soon};if(q.status==='Active')filter.expiryDate={$gt:soon};
 if(q.regex){const staff=await User.find({...(!manager(req.user)?{_id:req.user._id}:{}),$or:[{employeeName:q.regex},{employeeId:q.regex},{department:q.regex}]}).select('_id').maxTimeMS(3000).lean();filter.$or=[{staff:{$in:staff.map(u=>u._id)}},...['licenseNumber','authority','specialty','category'].map(k=>({[k]:q.regex}))];}
 const total=await License.countDocuments(filter).maxTimeMS(3000);const page=Math.min(q.page,Math.max(1,Math.ceil(total/q.limit)));
 const rows=await License.find(filter).select('-history').populate('staff','employeeName employeeId department').populate('reviewer','employeeName').sort(q.sort).skip((page-1)*q.limit).limit(q.limit).maxTimeMS(3000).lean();
 res.json({items:rows.map(r=>({...r,status:status(r.expiryDate)})),total,page,limit:q.limit});
}));
router.post('/',manage,wrap(async(req,res)=>{const b=req.body;if(!mongoose.isObjectIdOrHexString(b.staff))fail('Select a staff member.');const staff=await User.findById(b.staff);if(!staff||staff.isActive===false||['inactive','blocked'].includes(staff.status))fail('Select an active staff member.');if(!['Doctor','Nurse','Allied health','Other'].includes(b.profession))fail('Select a profession.');const authority=text(b,'authority',80),licenseNumber=text(b,'licenseNumber',100);const row=await License.create({staff:b.staff,profession:b.profession,specialty:text(b,'specialty',150,false),authority,category:text(b,'category',150),licenseNumber,licenseKey:JSON.stringify([authority.toLowerCase(),licenseNumber.toLowerCase()]),...dates(b),createdBy:req.user._id});res.status(201).json(row);}));
router.get('/:id/history',wrap(async(req,res)=>{
 const row=await record(req);const q=listQuery(req.query,{sorts:{name:'changedAt',changedAt:'changedAt'},statuses:['Pending','Verified','Rejected']});
 await row.populate('history.reviewer history.changedBy','employeeName');
 const rows=row.history.filter(h=>(!q.status||h.verification===q.status)&&(!q.regex||[h.licenseNumber,h.event,h.remarks,h.changedBy?.employeeName].some(v=>q.regex.test(v||'')))).sort((a,b)=>(a.changedAt-b.changedAt)*q.sort.changedAt);
 const page=Math.min(q.page,Math.max(1,Math.ceil(rows.length/q.limit)));res.json({items:rows.slice((page-1)*q.limit,page*q.limit),total:rows.length,page,limit:q.limit});
}));
router.put('/:id',manage,wrap(async(req,res)=>{
 const row=await record(req),b=req.body;if(!['Doctor','Nurse','Allied health','Other'].includes(b.profession))fail('Select a profession.');
 const authority=text(b,'authority',80),licenseNumber=text(b,'licenseNumber',100),next={profession:b.profession,specialty:text(b,'specialty',150,false),authority,category:text(b,'category',150),licenseNumber,...dates(b)};
 snapshot(row,req.user,'Edited');Object.assign(row,next,{licenseKey:JSON.stringify([authority.toLowerCase(),licenseNumber.toLowerCase()]),verification:'Pending',remarks:'',reviewer:undefined,reviewedAt:undefined});await row.save();res.json(row);
}));
router.post('/:id/renew',manage,wrap(async(req,res)=>{const row=await record(req),next=dates(req.body);if(next.expiryDate<=row.expiryDate)fail('Renewal expiry must be later than the current expiry.');const number=text(req.body,'licenseNumber',100);snapshot(row,req.user,'Renewed');Object.assign(row,next,{licenseNumber:number,licenseKey:JSON.stringify([row.authority.toLowerCase(),number.toLowerCase()]),verification:'Pending',remarks:'',reviewer:undefined,reviewedAt:undefined,certificateId:undefined});await row.save();res.json(row);}));
router.post('/:id/review',manage,wrap(async(req,res)=>{const row=await record(req);if(row.verification!=='Pending')fail('Only pending licences can be reviewed.',409);if(String(row.staff)===String(req.user._id))fail('Another reviewer must verify your licence.',403);if(!['Verified','Rejected'].includes(req.body.verification))fail('Choose Verified or Rejected.');const remarks=text(req.body,'remarks',1000,req.body.verification==='Rejected');snapshot(row,req.user,'Reviewed');Object.assign(row,{verification:req.body.verification,remarks,reviewer:req.user._id,reviewedAt:new Date()});await row.save();res.json(row);}));
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1,fields:0}}).single('certificate');
router.post('/:id/certificate',manage,(req,res,next)=>upload(req,res,e=>e?res.status(400).json({message:'Upload one PDF, PNG or JPEG, at most 5 MB.'}):next()),wrap(async(req,res)=>{const row=await record(req),f=req.file;if(!f)fail('Choose a certificate.');const b=f.buffer;const mime=b.subarray(0,5).toString()==='%PDF-'?'application/pdf':b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'image/png':b[0]===255&&b[1]===216&&b[2]===255?'image/jpeg':null;if(!mime)fail('Only PDF, PNG or JPEG certificates are supported.');const cert=await Certificate.create({license:row._id,name:f.originalname.slice(0,200),mime,data:b,uploadedBy:req.user._id});snapshot(row,req.user,'Certificate replaced');row.certificateId=cert._id;row.verification='Pending';row.remarks='';row.reviewer=undefined;row.reviewedAt=undefined;try{await row.save();}catch(e){await cert.deleteOne();throw e;}res.json({certificateId:cert._id});}));
router.get('/:id/certificate/:certificateId',wrap(async(req,res)=>{await record(req);if(!mongoose.isObjectIdOrHexString(req.params.certificateId))fail('Invalid certificate.');const cert=await Certificate.findOne({_id:req.params.certificateId,license:req.params.id}).select('+data');if(!cert)fail('Certificate not found.',404);res.set({'Content-Type':cert.mime,'Content-Disposition':'attachment; filename="certificate.'+({'application/pdf':'pdf','image/png':'png','image/jpeg':'jpg'}[cert.mime])+'"','X-Content-Type-Options':'nosniff'}).send(cert.data);}));
module.exports=router;
