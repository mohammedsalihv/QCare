const { listQuery } = require('../utils/listQuery');
const Designation = require("../models/Designation");

// @desc    Get all designations
// @route   GET /api/designations
// @access  Private
const getDesignations = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store');
    // Keep legacy selectors compatible; record tables explicitly request a page.
    if (req.query.page === undefined) return res.json(await Designation.find({}).lean());
    const options = listQuery(req.query, { sorts: {"name":"title","code":"code","grade":"grade","updatedAt":"updatedAt"} });
    const filter = {};
    if (options.status) filter.status = options.status;
    if (options.regex) filter.$or = ["title","code","grade","description"].map(field => ({ [field]: options.regex }));
    const total = await Designation.countDocuments(filter).maxTimeMS(3000);
    const page = Math.min(options.page, Math.max(1, Math.ceil(total / options.limit)));
    const items = await Designation.find(filter).select('title code grade description status updatedAt').sort(options.sort)
      .skip((page - 1) * options.limit).limit(options.limit).maxTimeMS(3000).lean();
    res.json({ items, total, page, limit: options.limit });
  } catch (error) {
    res.status(error.status === 400 ? 400 : 500).json({ message: error.status === 400 ? error.message : 'Could not load designations. Please try again.' });
  }
};

// @desc    Create a designation
// @route   POST /api/designations
// @access  Private/Admin
const createDesignation = async (req, res) => {
  try {
    const { title, code, grade, description, status } = req.body;

    if (!title || !code || !grade || !description) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    const designationExists = await Designation.findOne({
      $or: [{ title: title.trim() }, { code: code.trim().toUpperCase() }],
    });

    if (designationExists) {
      return res.status(400).json({ message: "Designation title or code already exists" });
    }

    const designation = await Designation.create({
      title: title.trim(),
      code: code.trim().toUpperCase(),
      grade: grade.trim(),
      description: description.trim(),
      status: status || "Active",
    });

    res.status(201).json(designation);
  } catch (error) {
    res.status(500).json({ message: "Failed to create designation" });
  }
};

// @desc    Update a designation
// @route   PUT /api/designations/:id
// @access  Private/Admin
const updateDesignation = async (req, res) => {
  try {
    const designation = await Designation.findById(req.params.id);

    if (!designation) {
      return res.status(404).json({ message: "Designation not found" });
    }

    // Check if the updated title or code conflicts with another designation
    if (req.body.title && req.body.title.trim() !== designation.title) {
      const titleExists = await Designation.findOne({ title: req.body.title.trim() });
      if (titleExists) {
        return res.status(400).json({ message: "Designation title already exists" });
      }
      designation.title = req.body.title.trim();
    }

    if (req.body.code && req.body.code.trim().toUpperCase() !== designation.code) {
      const codeExists = await Designation.findOne({ code: req.body.code.trim().toUpperCase() });
      if (codeExists) {
        return res.status(400).json({ message: "Designation code already exists" });
      }
      designation.code = req.body.code.trim().toUpperCase();
    }

    if (req.body.grade !== undefined) designation.grade = req.body.grade.trim();
    if (req.body.description !== undefined) designation.description = req.body.description.trim();
    if (req.body.status !== undefined) designation.status = req.body.status;

    const updatedDesignation = await designation.save();
    res.json(updatedDesignation);
  } catch (error) {
    res.status(500).json({ message: "Failed to update designation" });
  }
};

// @desc    Delete a designation
// @route   DELETE /api/designations/:id
// @access  Private/SuperAdmin
const deleteDesignation = async (req, res) => {
  try {
    const designation = await Designation.findById(req.params.id);

    if (!designation) {
      return res.status(404).json({ message: "Designation not found" });
    }

    await designation.deleteOne();
    res.json({ message: "Designation removed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete designation" });
  }
};

module.exports = {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
};
