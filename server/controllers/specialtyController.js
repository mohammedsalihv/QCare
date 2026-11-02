const { listQuery } = require('../utils/listQuery');
const mongoose = require('mongoose');
const Specialty = require('../models/Specialty');
const User = require('../models/users');
const populate = query => query.populate('head', 'employeeName employeeId designation status isActive');
const fail = (res, error) => res.status(error.code === 11000 ? 409 : error.status || 400).json({ message: error.code === 11000 ? 'A specialty with this name already exists.' : error.message });
const invalid = message => { const error = new Error(message); error.status = 400; throw error; };
const validId = value => typeof value === 'string' && mongoose.isObjectIdOrHexString(value);
async function values(body, existing) {
  const result = {};
  if (!existing || body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 150) invalid('Enter a specialty name of up to 150 characters.');
    result.name = body.name.trim().replace(/\s+/g, ' ');
    result.nameKey = result.name.toLowerCase();
  }
  if (!existing || body.head !== undefined) {
    const head = body.head || null;
    if (head && !validId(head)) invalid('Select a specialty lead from the staff list.');
    if (head && (!existing || String(existing.head) !== head)) {
      const user = await User.findById(head);
      if (!user || user.isActive === false || ['inactive', 'blocked'].includes(user.status)) invalid('Select an active user as the specialty lead.');
    }
    result.head = head;
  }
  if (body.status !== undefined) {
    if (!['Active', 'Inactive'].includes(body.status)) invalid('Choose Active or Inactive.');
    result.status = body.status;
  }
  return result;
}
exports.getSpecialties = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    // Keep the existing array contract for selectors until they migrate.
    if (req.query.page === undefined) return res.json(await populate(Specialty.find().sort({ name: 1 })).lean());
    const options = listQuery(req.query, { sorts: { name: 'nameKey', status: 'status', updatedAt: 'updatedAt' } });
    const filter = {};
    if (options.status) filter.status = options.status;
    if (options.regex) {
      const heads = await User.find({ employeeName: options.regex }).select('_id').maxTimeMS(3000).lean();
      filter.$or = [{ name: options.regex }, { head: { $in: heads.map(user => user._id) } }];
    }
    const total = await Specialty.countDocuments(filter).maxTimeMS(3000);
    const page = Math.min(options.page, Math.max(1, Math.ceil(total / options.limit)));
    const items = await Specialty.find(filter).select('name head status updatedAt').sort(options.sort)
      .skip((page - 1) * options.limit).limit(options.limit).populate('head', 'employeeName')
      .maxTimeMS(3000).lean();
    res.json({ items, total, page, limit: options.limit });
  } catch (error) {
    res.status(error.status === 400 ? 400 : 500).json({ message: error.status === 400 ? error.message : 'Could not load specialties. Please try again.' });
  }
};
exports.createSpecialty = async (req, res) => {
  try {
    const specialty = await Specialty.create({ ...await values(req.body), createdBy: req.user._id });
    await specialty.populate([{ path: 'head', select: 'employeeName employeeId designation status isActive' }]);
    res.status(201).json(specialty);
  } catch (error) { fail(res, error); }
};
exports.updateSpecialty = async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid specialty ID.' });
    const specialty = await Specialty.findById(req.params.id);
    if (!specialty) return res.status(404).json({ message: 'Specialty not found. Refresh the list.' });
    Object.assign(specialty, await values(req.body, specialty), { updatedBy: req.user._id });
    await specialty.save();
    await specialty.populate([{ path: 'head', select: 'employeeName employeeId designation status isActive' }]);
    res.json(specialty);
  } catch (error) { fail(res, error); }
};
exports.deleteSpecialty = async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid specialty ID.' });
    const specialty = await Specialty.findById(req.params.id);
    if (!specialty) return res.status(404).json({ message: 'Specialty not found. Refresh the list.' });
    await specialty.deleteOne();
    res.json({ message: 'Specialty deleted.' });
  } catch (error) { fail(res, error); }
};
