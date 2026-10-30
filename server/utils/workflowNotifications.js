const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/users');
const id = value => value?._id || value;
module.exports = async ({ module, recordId, title, status, actor, requester, participants = [], reason = '', actionLink, sourceKey, at = new Date(), recipientRoles = ['qualitymanager', 'admin'] }) => {
 if (mongoose.connection.readyState !== 1) return;
 try {
  const person = async value => {
   if (!value) return undefined;
   if (value.employeeName) return { id: id(value), name: value.employeeName };
   const user = await User.findById(id(value)).select('employeeName');
   return { id: id(value), name: user?.employeeName || 'Former user' };
  };
  const [who, owner] = await Promise.all([person(actor), person(requester)]);
  if (!who) return;
  const data = { type: 'system_alert', message: title + ': ' + status + (reason ? ' — ' + reason : ''),
   user: who.name, userId: who.id, recipientRole: 'user', recipientRoles,
   recipientIds: [...new Set([id(actor), id(requester), ...participants.map(id)].filter(Boolean).map(String))],
   actionLink, ...(sourceKey ? {sourceKey} : {}),
   workflow: {module, recordId: String(recordId), title, status, reason, actor: who, requester: owner, occurredAt: at}
  };
  if (sourceKey) {
   await Notification.updateOne({sourceKey}, {$setOnInsert: data}, {upsert: true, runValidators: true});
   await Notification.updateOne({sourceKey, 'workflow.recordId': {$exists:false}}, {$set:{workflow:data.workflow,recipientIds:data.recipientIds,recipientRoles:data.recipientRoles}});
  }
  else await Notification.create(data);
 } catch (error) { if(error.code !== 11000) console.error('Workflow notification:', error.message); }
};
