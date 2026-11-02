const mongoose = require('mongoose');
const revision = new mongoose.Schema({ event: String, profession: String, specialty: String, authority: String, category: String, licenseNumber: String, issuedDate: Date, expiryDate: Date, verification: String, remarks: String, reviewer: {type: mongoose.Schema.Types.ObjectId, ref:'User'}, changedBy: {type: mongoose.Schema.Types.ObjectId, ref:'User'}, changedAt: Date, certificateId: mongoose.Schema.Types.ObjectId }, {_id:false});
const schema = new mongoose.Schema({
 staff: {type:mongoose.Schema.Types.ObjectId,ref:'User',required:true,index:true},
 profession:{type:String,enum:['Doctor','Nurse','Allied health','Other'],required:true}, specialty:{type:String,trim:true,maxlength:150},
 authority:{type:String,required:true,trim:true,maxlength:80}, category:{type:String,required:true,trim:true,maxlength:150},
 licenseNumber:{type:String,required:true,trim:true,maxlength:100}, licenseKey:{type:String,required:true,unique:true},
 issuedDate:{type:Date,required:true},expiryDate:{type:Date,required:true,index:true},
 verification:{type:String,enum:['Pending','Verified','Rejected'],default:'Pending'},remarks:{type:String,maxlength:1000,default:''},
 reviewer:{type:mongoose.Schema.Types.ObjectId,ref:'User'},reviewedAt:Date,
 certificateId:mongoose.Schema.Types.ObjectId,
 history:[revision], createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true}
},{timestamps:true,optimisticConcurrency:true});
schema.index({profession:1,expiryDate:1,_id:1});
module.exports=mongoose.model('ClinicalStaffLicense',schema);
