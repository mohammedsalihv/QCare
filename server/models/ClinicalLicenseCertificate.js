const mongoose=require('mongoose');
module.exports=mongoose.model('ClinicalLicenseCertificate',new mongoose.Schema({license:{type:mongoose.Schema.Types.ObjectId,ref:'ClinicalStaffLicense',required:true,index:true},name:String,mime:String,data:{type:Buffer,select:false},uploadedBy:mongoose.Schema.Types.ObjectId},{timestamps:true}));
