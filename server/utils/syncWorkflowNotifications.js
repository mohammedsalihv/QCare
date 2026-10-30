const event = require('./workflowNotifications');
const Notification = require('../models/Notification');
module.exports = async () => {
 const sources = [
  { model: require('../models/KPIIndicator'), query: {validationStatus: {$in:['Pending Validation','Pending Approval']}}, module: 'KPI report', link:'/dashboard/kpi', title:r=>r.indicatorName || r.indicatorCode, requester:r=>r.submittedBy || r.createdBy, actor:r=>r.validationStatus === 'Pending Approval' ? r.validatedBy || r.submittedBy || r.createdBy : r.submittedBy || r.createdBy, status:r=>r.validationStatus === 'Pending Approval' ? 'Validated · awaiting approval' : 'Awaiting validation'},
  { model: require('../models/ChangeRequest'), query: {status:'Pending Approval'}, module:'Change request', link:'/dashboard/change-management',title:r=>r.title,requester:r=>r.requestedBy,actor:r=>r.requestedBy,status:r=>r.status},
  { model: require('../models/ClinicalPrivilege'), query: {status:'pending-approval'}, module:'Clinical privileges',link:'/dashboard/cp', title:r=>r.specialty + ' privileges',requester:r=>r.requestedBy || r.staffId,actor:r=>r.requestedBy || r.staffId,status:r=>r.status,roles:['qualitymanager']},
  { model: require('../models/ClinicalAudit'), query:{status:'pending-review'},module:'Audit assessment',link:'/dashboard/audit',title:r=>r.auditTitle,requester:r=>r.submittedBy || r.scheduleRequestedBy,actor:r=>r.submittedBy || r.scheduleRequestedBy,status:()=> 'Awaiting review',roles:['qualitymanager']}
 ];
 for (const source of sources) {
  const rows = await source.model.find(source.query);
  for(const row of rows) {
   if(!source.actor(row)) continue;
   const status = source.status(row);
   if(await Notification.exists({'workflow.recordId':String(row._id),'workflow.module':source.module,'workflow.status':status})) continue;
   await event({module:source.module,recordId:row._id,title:source.title(row),status,actor:source.actor(row),requester:source.requester(row),at:row.updatedAt || row.createdAt,sourceKey:'workflow-backfill:'+source.module+':'+row._id+':'+status,actionLink:source.link,recipientRoles:source.roles});
  }
 }
};
