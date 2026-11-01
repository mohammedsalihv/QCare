const mongoose = require('mongoose');
const Specialty = require('../models/Specialty');
const Department = require('../models/department');
const User = require('../models/users');
const populate = query => query.populate('department', 'name').populate('head', 'employeeName employeeId designation status isActive');
const fail = (res, error) => res.status(error.code === 11000 ? 409 : error.status || 400).json({ message: error.code === 11000 ? 'A specialty with this name already exists.' : error.message });
const invalid = message => { const error = new Error(message); error.status = 400; throw error; };
const validId = value => typeof value === 'string' && mongoose.isObjectIdOrHexString(value);
async function values(body, existing) {
  const result = {};
  let department;
  if (!existing || body.department !== undefined) {
    if (!validId(body.department)) invalid('Select a department from the list.');
    department = await Department.findById(body.department);
    if (!department) invalid('This department no longer exists. Refresh the department list.');
    result.department = body.department;
  }
  if (!existing || body.name !== undefined) {
    if (body.name !== undefined && typeof body.name !== 'string') invalid('Enter a specialty name of up to 150 characters.');
    let name = body.name?.trim();
    if (!name) {
      department ||= await Department.findById(existing.department);
      if (!department) invalid('This department no longer exists. Refresh the department list.');
      name = department.name.trim();
    }
    if (!name || name.length > 150) invalid('Enter a specialty name of up to 150 characters.');
    result.name = name.replace(/\s+/g, ' ');
    if (result.name.toLowerCase() === 'n/a') result.name = 'N/A';
    result.nameKey = result.name === 'N/A' ? 'n/a:' + String(result.department || existing.department) : result.name.toLowerCase();
  }
  // N/A is distinct for each department, including department-only edits.
  if (existing?.name === 'N/A' && result.department && body.name === undefined) {
    result.nameKey = 'n/a:' + String(result.department);
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
  try { res.json(await populate(Specialty.find().sort({ name: 1 }))); }
  catch { res.status(500).json({ message: 'Could not load specialties. Please try again.' }); }
};
exports.createSpecialty = async (req, res) => {
  try {
    const specialty = await Specialty.create({ ...await values(req.body), createdBy: req.user._id });
    await specialty.populate([{ path: 'department', select: 'name' }, { path: 'head', select: 'employeeName employeeId designation status isActive' }]);
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
    await specialty.populate([{ path: 'department', select: 'name' }, { path: 'head', select: 'employeeName employeeId designation status isActive' }]);
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
