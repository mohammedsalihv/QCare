const { protect } = require("../middleware/authMiddleware");
const express = require("express");
const router = express.Router();
const multer = require('multer');
const Incident = require('../models/Incident');
const upload = multer({storage:multer.memoryStorage(),limits:{files:5,fileSize:12*1024*1024,fields:1,fieldSize:100000}}).array('attachments',5);
const reportUpload = (req,res,next) => {
 if (!req.is('multipart/form-data')) return next();
 upload(req,res,error=>{if(error)return res.status(400).json({message:'Attach up to 5 files, at most 12 MB each and 12 MB combined.'});try{req.body=JSON.parse(req.body.payload);if(!req.body || Array.isArray(req.body))throw Error();next();}catch{return res.status(400).json({message:'Invalid report.'});}});
};
router.get('/:id/attachments/:attachmentId',protect,async(req,res)=>{
 try { const row=await Incident.findById(req.params.id).select('+attachments.data');
 if(!row || (!['admin','superadmin'].includes(req.user.role.toLowerCase()) && String(row.reportedBy)!==String(req.user._id) && !row.notifyStaff.some(id=>String(id)===String(req.user._id))))return res.status(404).json({message:'Attachment not found.'});
 const attachment=row.attachments.id(req.params.attachmentId);if(!attachment)return res.status(404).json({message:'Attachment not found.'});
 res.set({'Content-Type':'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-store','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(attachment.name)}).send(attachment.data);
 } catch {res.status(400).json({message:'Could not download attachment.'});}
});
const {
  createIncident,
  getIncidents,
  updateIncident,
} = require("../controllers/incidentController");


router.route("/")
  .post(protect, reportUpload, createIncident)
  .get(protect, getIncidents);

router.route("/:id")
  .patch(protect, updateIncident);

module.exports = router;
