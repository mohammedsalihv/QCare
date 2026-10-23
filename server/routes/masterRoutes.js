const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const Master = require('../models/ClinicalMaster');
const User = require('../models/users');
const Department = require('../models/department');
const router = express.Router();
const fields = {
  specialties: ['name', 'code', 'department', 'head', 'status'],
  'procedure-categories': ['name', 'status'],
  procedures: ['name', 'categoryId', 'req', 'status'],
  'physician-profiles': ['staffId', 'gender', 'specialty', 'qualification', 'licenseType', 'licenseNumber', 'expiryDate', 'status', 'verificationStatus', 'remarks'],
};
router.use(protect);
router.param('kind', (req, res, next, kind) => fields[kind] ? next() : res.status(404).json({ message: 'Master not found' }));
async function validate(kind, values) {
  if (kind !== 'physician-profiles' && !values.name?.trim()) throw new Error('Name is required');
  if (kind === 'specialties') {
    if (!values.code?.trim()) throw new Error('Specialty code is required');
    if (!await Department.exists({ name: values.department })) throw new Error('Select a department from Department Master');
    if (!await User.exists({ _id: values.head })) throw new Error('Select a lead from User Master');
  }
  if (kind === 'procedures' && !await Master.exists({ _id: values.categoryId, kind: 'procedure-categories', status: 'Active' })) throw new Error('Select an active procedure category');
  if (kind === 'physician-profiles') {
    if (!values.staffId || !await User.exists({ _id: values.staffId })) throw new Error('Select a physician from User Master');
    if (!await Master.exists({ kind: 'specialties', name: values.specialty })) throw new Error('Select a specialty from Specialty Master');
  }
}
const populate = query => query.populate('staffId', 'employeeName employeeId').populate('head', 'employeeName').populate('createdBy', 'employeeName').populate('categoryId', 'name').populate('verifier', 'employeeName');
router.get('/:kind', async (req, res) => {
  try { res.json(await populate(Master.find({ kind: req.params.kind }).sort({ name: 1 }))); }
  catch (error) { res.status(500).json({ message: 'Unable to load master records' }); }
});
const manage = authorize('SuperAdmin', 'admin', 'QualityManager');
async function save(req, res) {
  try {
    const kind = req.params.kind;
    const values = Object.fromEntries(fields[kind].filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
    const record = req.params.id ? await Master.findOne({ _id: req.params.id, kind }) : new Master({ kind, createdBy: req.user._id });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    await validate(kind, { ...record.toObject(), ...values });
    if (kind === 'physician-profiles' && values.verificationStatus) values.verifier = req.user._id;
    record.set(values);
    await record.save();
    res.status(req.params.id ? 200 : 201).json(await populate(Master.findById(record._id)));
  } catch (error) { res.status(400).json({ message: error.code === 11000 ? 'This master record already exists' : error.message }); }
}
router.post('/:kind', manage, save);
router.put('/:kind/:id', manage, save);
// Archive master records so historical references remain resolvable.
router.delete('/:kind/:id', manage, async (req, res) => {
  try {
    const record = await Master.findOneAndUpdate({ _id: req.params.id, kind: req.params.kind }, { status: 'Inactive' }, { new: true });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (error) { res.status(400).json({ message: error.message }); }
});
module.exports = router;
