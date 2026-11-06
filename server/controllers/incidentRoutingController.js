const mongoose = require('mongoose');
const Routing = require('../models/IncidentRouting');
const Department = require('../models/department');
const Location = require('../models/Location');
const User = require('../models/users');
const { reviewer } = require('../utils/incidentWorkflow');
exports.read = async (req, res) => {
  if (!reviewer(req.user)) return res.status(403).json({ message: 'Only Quality reviewers can manage routing.' });
  try {
    const saved = await Routing.findOne({ key: 'default' }).lean();
    if (saved) return res.json(saved);
    const [departments, branches, users] = await Promise.all([
      Department.find({ isActive: { $ne: false } }).select('head').lean(),
      Location.find({ isActive: { $ne: false } }).select('hodName inchargeName').lean(),
      User.find({ isActive: { $ne: false }, status: { $nin: ['inactive', 'blocked'] } }).select('employeeName employeeId').lean(),
    ]);
    const match = name => {
      const normalized = String(name || '').trim().toLowerCase();
      const found = users.filter(u => [u.employeeName, u.employeeId, String(u._id)].some(value => String(value || '').trim().toLowerCase() === normalized));
      return found.length === 1 ? found[0]._id : undefined;
    };
    res.json({ departments: departments.map(d => ({ department: d._id, owner: match(d.head), keywords: [] })).filter(d => d.owner), branches: branches.map(b => ({ branch: b._id, owner: match(b.hodName) || match(b.inchargeName) })).filter(b => b.owner), __v: 0, suggested: true });
  }
  catch { res.status(500).json({ message: 'Could not load routing settings.' }); }
};
exports.save = async (req, res) => {
  if (!reviewer(req.user)) return res.status(403).json({ message: 'Only Quality reviewers can manage routing.' });
  try {
    const { departments, branches, fallback, version } = req.body;
    if (!Array.isArray(departments) || !Array.isArray(branches) || departments.length > 200 || branches.length > 200) throw Error('Invalid routing rules.');
    const validId = id => mongoose.isObjectIdOrHexString(id);
    const ids = [fallback, ...departments.map(d => d.owner), ...branches.map(b => b.owner)];
    if (ids.some(id => !validId(id)) || await User.countDocuments({ _id: { $in: ids }, isActive: { $ne: false }, status: { $nin: ['inactive', 'blocked'] } }) !== new Set(ids).size) throw Error('Choose active users for all responsibilities and the Quality fallback.');
    const quality = await User.findById(fallback).select('role').lean();
    if (!['admin', 'superadmin', 'qualitymanager', 'qualityofficer'].includes(quality.role?.toLowerCase())) throw Error('Choose a Quality Manager, Quality Officer or administrator as the Quality investigator.');
    for (const [rows, key, Model] of [[departments, 'department', Department], [branches, 'branch', Location]]) {
      const values = rows.map(r => r[key]);
      if (values.some(id => !validId(id)) || new Set(values).size !== values.length || await Model.countDocuments({ _id: { $in: values }, isActive: { $ne: false } }) !== values.length) throw Error('Choose each active department or branch only once.');
    }
    if (departments.some(d => !Array.isArray(d.keywords) || d.keywords.length > 30 || d.keywords.some(k => typeof k !== 'string' || k.trim().length < 3 || k.length > 80))) throw Error('Use up to 30 phrases per department, each 3–80 characters.');
    let row = await Routing.findOne({ key: 'default' });
    if ((row?.__v || 0) !== version) return res.status(409).json({ message: 'Routing changed. Reload settings before saving.' });
    row ||= new Routing({ key: 'default' });
    row.set({ fallback, departments: departments.map(d => ({ department: d.department, owner: d.owner, keywords: d.keywords.map(k => k.trim()) })), branches: branches.map(b => ({ branch: b.branch, owner: b.owner })), updatedBy: req.user._id });
    await row.save(); res.json(row);
  } catch (error) { res.status(error.name === 'VersionError' || error.code === 11000 ? 409 : 400).json({ message: error.name === 'VersionError' || error.code === 11000 ? 'Routing changed. Reload settings.' : error.message }); }
};
