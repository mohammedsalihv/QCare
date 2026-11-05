const mongoose = require('mongoose');
const User = require('../models/users');
const Location = require('../models/Location');
const Department = require('../models/department');
const fail = message => { const error = new Error(message); error.status = 400; throw error; };
async function validateIncidentReport(body, files) {
  if (!body.title?.trim() || !body.description?.trim()) fail('Enter a title and incident details.');
  const date = new Date(body.dateOfIncident);
  if (!Number.isFinite(+date) || date > new Date()) fail('Choose a valid incident date and time in the past.');
  const result = {};
  if (body.notifyChoice !== undefined) {
    if (!['Yes', 'No'].includes(body.notifyChoice)) fail('Choose whether additional staff should be notified.');
    if (!body.branch || !body.department?.trim() || !body.harmLevel) fail('Select a branch, corresponding department and harm level.');
  }
  result.notifyChoice = body.notifyChoice || '';
  if (body.branch) {
    if (!mongoose.isObjectIdOrHexString(body.branch)) fail('Select a valid branch.');
    const branch = await Location.findById(body.branch);
    if (!branch || branch.isActive === false) fail('Select an active branch.');
    result.branch = branch._id; result.location = branch.name;
  } else if (!body.location?.trim()) fail('Select a branch.');
  for (const key of ['department','areaRoom','witnesses','immediateActions']) {
    if (body[key] !== undefined && (typeof body[key] !== 'string' || body[key].length > 5000)) fail('Invalid ' + key + '.');
    result[key] = body[key]?.trim() || '';
  }
  if (result.department && !await Department.exists({name:result.department,isActive:{$ne:false}})) fail('Select an active department.');
  result.harmLevel = body.harmLevel || 'Unknown';
  if (!['No harm','Low harm','Moderate harm','Severe harm','Death','Unknown'].includes(result.harmLevel)) fail('Choose a harm level.');
  for (const key of ['involvedStaff','notifyStaff']) {
    const values = body[key] || [];
    if (!Array.isArray(values) || values.length > 50 || values.some(id=>!mongoose.isObjectIdOrHexString(id))) fail('Select valid staff members.');
    result[key] = [...new Set(values)];
    if (await User.countDocuments({_id:{$in:result[key]},isActive:{$ne:false},status:{$nin:['blocked','inactive']}}) !== result[key].length) fail('Select active staff members.');
  }
  if (result.notifyChoice === 'Yes' && !result.notifyStaff.length) fail('Select at least one staff member to notify.');
  if (result.notifyChoice === 'No' && result.notifyStaff.length) fail('Remove notification recipients or choose Yes.');
  if (files.reduce((n,f)=>n+f.size,0)>12*1024*1024) fail('Attachments must total 12 MB or less.');
  const allowed = /\.(png|jpe?g|gif|webp|pdf|mp4|mov|webm|mp3|wav|txt|csv|docx|xlsx|pptx)$/i;
  result.attachments = files.map(file=>{
    if (!allowed.test(file.originalname)) fail('Unsupported attachment. Use images, video, audio, PDF or office documents.');
    return {name:file.originalname.replace(/[\\/\r\n]/g,'_').slice(0,180),mime:'application/octet-stream',size:file.size,data:file.buffer};
  });
  return result;
}
module.exports = { validateIncidentReport };
