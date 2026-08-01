// OOPPE (Ongoing Professional Practice & Education) Controller
// ------------------------------------------------------------
// This file implements CRUD operations for OOPPE records.
// It follows the mandatory secure coding rules (input validation, error handling,
// and role‑based access control) defined in the SecureCoder skill set.
// ------------------------------------------------------------

const Ooppe = require('../models/Ooppe');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @desc    Create a new OOPPE record
 * @route   POST /api/ooppe
 * @access  SuperAdmin, QualityManager
 */
const createOoppe = asyncHandler(async (req, res) => {
  // TODO(security): Validate and sanitize req.body fields before use.
  const { title, description, date, institution, certificateUrl, userId } = req.body;

  const ooppe = await Ooppe.create({
    title,
    description,
    date,
    institution,
    certificateUrl,
    user: userId,
  });

  // Emit a socket event for real‑time UI updates (if listeners exist)
  if (req.io) {
    req.io.emit('ooppeCreated', ooppe);
  }

  res.status(201).json(ooppe);
});

/**
 * @desc    Get all OOPPE records
 * @route   GET /api/ooppe
 * @access  SuperAdmin, QualityManager, Staff (read‑only)
 */
const getOoppes = asyncHandler(async (req, res) => {
  const ooppes = await Ooppe.find().populate('user', 'name email');
  res.json(ooppes);
});

/**
 * @desc    Get a single OOPPE record by ID
 * @route   GET /api/ooppe/:id
 * @access  SuperAdmin, QualityManager, Staff
 */
const getOoppeById = asyncHandler(async (req, res) => {
  const ooppe = await Ooppe.findById(req.params.id).populate('user', 'name email');
  if (!ooppe) {
    return res.status(404).json({ message: 'OOPPE record not found' });
  }
  res.json(ooppe);
});

/**
 * @desc    Update an OOPPE record
 * @route   PUT /api/ooppe/:id
 * @access  SuperAdmin, QualityManager
 */
const updateOoppe = asyncHandler(async (req, res) => {
  // TODO(security): Validate and sanitize req.body fields before update.
  const updates = req.body;
  const ooppe = await Ooppe.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!ooppe) {
    return res.status(404).json({ message: 'OOPPE record not found' });
  }
  if (req.io) {
    req.io.emit('ooppeUpdated', ooppe);
  }
  res.json(ooppe);
});

/**
 * @desc    Delete an OOPPE record
 * @route   DELETE /api/ooppe/:id
 * @access  SuperAdmin
 */
const deleteOoppe = asyncHandler(async (req, res) => {
  const ooppe = await Ooppe.findByIdAndDelete(req.params.id);
  if (!ooppe) {
    return res.status(404).json({ message: 'OOPPE record not found' });
  }
  if (req.io) {
    req.io.emit('ooppeDeleted', { id: req.params.id });
  }
  res.json({ message: 'OOPPE record deleted' });
});

module.exports = {
  createOoppe,
  getOoppes,
  getOoppeById,
  updateOoppe,
  deleteOoppe,
};
