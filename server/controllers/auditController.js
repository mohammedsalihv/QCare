const Audit = require('../models/Audit');

// @desc    Get all audits
// @route   GET /api/audits
// @access  Private/Admin
const getAudits = async (req, res) => {
  try {
    const audits = await Audit.find({}).populate('auditor', 'employeeName email');
    res.json(audits);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching audits', error: error.message });
  }
};

// @desc    Create new audit
// @route   POST /api/audits
// @access  Private/Admin
const createAudit = async (req, res) => {
  try {
    const { title, department, auditDate, auditor, checklist } = req.body;
    
    const audit = new Audit({
      title,
      department,
      auditDate,
      auditor,
      checklist
    });

    const createdAudit = await audit.save();
    res.status(201).json(createdAudit);
  } catch (error) {
    res.status(400).json({ message: 'Error creating audit', error: error.message });
  }
};

// @desc    Update audit
// @route   PUT /api/audits/:id
// @access  Private/Admin
const updateAudit = async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id);

    if (audit) {
      audit.title = req.body.title || audit.title;
      audit.department = req.body.department || audit.department;
      audit.auditDate = req.body.auditDate || audit.auditDate;
      audit.auditor = req.body.auditor || audit.auditor;
      audit.status = req.body.status || audit.status;
      audit.checklist = req.body.checklist || audit.checklist;
      audit.summary = req.body.summary || audit.summary;
      audit.recommendations = req.body.recommendations || audit.recommendations;

      const updatedAudit = await audit.save();
      res.json(updatedAudit);
    } else {
      res.status(404).json({ message: 'Audit not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error updating audit', error: error.message });
  }
};

// @desc    Delete audit
// @route   DELETE /api/audits/:id
// @access  Private/Admin
const deleteAudit = async (req, res) => {
  try {
    const audit = await Audit.findById(req.params.id);
    if (audit) {
      await audit.remove();
      res.json({ message: 'Audit removed' });
    } else {
      res.status(404).json({ message: 'Audit not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting audit', error: error.message });
  }
};

module.exports = {
  getAudits,
  createAudit,
  updateAudit,
  deleteAudit
};
