const mongoose = require('mongoose');
const Routing = require('../models/IncidentRouting');
const Department = require('../models/department');
const User = require('../models/users');
const { reviewer } = require('../utils/incidentWorkflow');
const publicSettings = row => ({ fallback: row?.fallback || '', __v: row?.__v || 0, departments: (row?.departments || []).map(d => ({ department: d.department, keywords: d.keywords || [] })) });
exports.read = async (req, res) => {
  if (!reviewer(req.user)) return res.status(403).json({ message: 'Only Quality reviewers can manage incident settings.' });
  try { res.json(publicSettings(await Routing.findOne({ key: 'default' }).lean())); }
  catch { res.status(500).json({ message: 'Could not load incident settings.' }); }
};
exports.save = async (req, res) => {
  if (!reviewer(req.user)) return res.status(403).json({ message: 'Only Quality reviewers can manage incident settings.' });
  try {
    const { departments, fallback, version } = req.body;
    if (req.body.branches !== undefined || departments?.some(d => d.owner !== undefined)) throw Error('Manage department heads and branch managers in their master records. Reload this page.');
    if (!Array.isArray(departments) || departments.length > 200) throw Error('Invalid department matching rules.');
    if (!mongoose.isObjectIdOrHexString(fallback)) throw Error('Choose a Quality investigator.');
    const quality = await User.findOne({ _id: fallback, isActive: { $ne: false }, status: { $nin: ['inactive', 'blocked'] } }).select('role').lean();
    if (!quality || !['admin', 'superadmin', 'qualitymanager', 'qualityofficer'].includes(quality.role?.toLowerCase())) throw Error('Choose an active Quality Manager, Quality Officer or administrator.');
    const ids = departments.map(d => d.department);
    if (ids.some(id => !mongoose.isObjectIdOrHexString(id)) || new Set(ids).size !== ids.length || await Department.countDocuments({ _id: { $in: ids }, isActive: { $ne: false } }) !== ids.length) throw Error('Choose each active department only once.');
    if (departments.some(d => !Array.isArray(d.keywords) || d.keywords.length > 30 || d.keywords.some(k => typeof k !== 'string' || k.trim().length < 3 || k.length > 80))) throw Error('Use up to 30 phrases per department, each 3–80 characters.');
    let row = await Routing.findOne({ key: 'default' });
    if ((row?.__v || 0) !== version) return res.status(409).json({ message: 'Settings changed. Reload before saving.' });
    row ||= new Routing({ key: 'default' });
    row.set({ fallback, departments: departments.map(d => ({ department: d.department, keywords: d.keywords.map(k => k.trim()) })), updatedBy: req.user._id });
    await row.save(); res.json(publicSettings(row));
  } catch (error) { res.status(error.name === 'VersionError' || error.code === 11000 ? 409 : 400).json({ message: error.name === 'VersionError' || error.code === 11000 ? 'Settings changed. Reload this page.' : error.message }); }
};
