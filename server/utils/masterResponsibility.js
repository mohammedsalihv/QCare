const mongoose = require('mongoose');
const User = require('../models/users');
const active = { isActive: { $ne: false }, status: { $nin: ['inactive', 'blocked'] } };
async function resolveMasterUser(id, legacyName) {
  if (id) return mongoose.isObjectIdOrHexString(id) ? User.findOne({ _id: id, ...active }).select('_id employeeName').lean() : null;
  const name = String(legacyName || '').trim();
  if (!name || name === 'Not Assigned') return null;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const users = await User.find({ ...active, $or: [{ employeeName: { $regex: '^' + escaped + '$', $options: 'i' } }, { employeeId: name }] }).select('_id employeeName').limit(2).lean();
  return users.length === 1 ? users[0] : null;
}
async function selectedMasterUser(id) {
  if (!id) return null;
  const user = await resolveMasterUser(id);
  if (!user) { const error = new Error('Select an active staff member.'); error.status = 400; throw error; }
  return user;
}
module.exports = { resolveMasterUser, selectedMasterUser };
