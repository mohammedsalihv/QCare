const { listQuery } = require('../utils/listQuery');
const Department = require("../models/department");

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    if (req.query.page === undefined) return res.json(await Department.find({}).lean());
    const options = listQuery(req.query, { sorts: { name: 'name', head: 'head', location: 'location', updatedAt: 'updatedAt' } });
    const filter = {};
    if (options.status) filter.isActive = options.status === 'Active';
    if (options.regex) filter.$or = ['name', 'head', 'location'].map(field => ({ [field]: options.regex }));
    const total = await Department.countDocuments(filter).maxTimeMS(3000);
    const page = Math.min(options.page, Math.max(1, Math.ceil(total / options.limit)));
    const items = await Department.find(filter).select('name code head location isActive updatedAt').sort(options.sort)
      .skip((page - 1) * options.limit).limit(options.limit).maxTimeMS(3000).lean();
    res.json({ items, total, page, limit: options.limit });
  } catch (error) {
    res.status(error.status === 400 ? 400 : 500).json({ message: error.status === 400 ? error.message : 'Could not load departments. Please try again.' });
  }
};

// @desc    Create a department
// @route   POST /api/departments
// @access  Private/Admin
const createDepartment = async (req, res) => {
  try {
    const { name, code, head, location } = req.body;

    const deptExists = await Department.findOne({ $or: [{ name }, { code }] });

    if (deptExists) {
      return res.status(400).json({ message: "Department name or code already exists" });
    }

    const department = await Department.create({
      name,
      code,
      head,
      location,
    });

    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a department
// @route   PUT /api/departments/:id
// @access  Private/Admin
const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    department.name = req.body.name || department.name;
    department.code = req.body.code || department.code;
    department.head = req.body.head || department.head;
    department.location = req.body.location || department.location;
    department.isActive = req.body.isActive !== undefined ? req.body.isActive : department.isActive;

    const updatedDept = await department.save();
    res.json(updatedDept);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a department
// @route   DELETE /api/departments/:id
// @access  Private/SuperAdmin
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);

    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    await department.deleteOne();
    res.json({ message: "Department removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
