const Risk = require('../models/Risk');

// @desc    Get all risks
// @route   GET /api/risks
// @access  Private/Admin
const getRisks = async (req, res) => {
  try {
    const risks = await Risk.find({})
      .populate('owner', 'employeeName email')
      .populate('identifiedBy', 'employeeName email');
    res.json(risks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching risks', error: error.message });
  }
};

// @desc    Create new risk
// @route   POST /api/risks
// @access  Private/Admin
const createRisk = async (req, res) => {
  try {
    const { title, description, category, department, probability, impact, mitigationStrategy, owner, reviewDate } = req.body;
    
    const score = probability * impact;
    
    const risk = new Risk({
      title,
      description,
      category,
      department,
      probability,
      impact,
      score,
      mitigationStrategy,
      owner,
      identifiedBy: req.user._id,
      reviewDate
    });

    const createdRisk = await risk.save();
    res.status(201).json(createdRisk);
  } catch (error) {
    res.status(400).json({ message: 'Error creating risk', error: error.message });
  }
};

// @desc    Update risk
// @route   PUT /api/risks/:id
// @access  Private/Admin
const updateRisk = async (req, res) => {
  try {
    const risk = await Risk.findById(req.params.id);

    if (risk) {
      risk.title = req.body.title || risk.title;
      risk.description = req.body.description || risk.description;
      risk.category = req.body.category || risk.category;
      risk.department = req.body.department || risk.department;
      risk.probability = req.body.probability || risk.probability;
      risk.impact = req.body.impact || risk.impact;
      risk.score = risk.probability * risk.impact;
      risk.mitigationStrategy = req.body.mitigationStrategy || risk.mitigationStrategy;
      risk.status = req.body.status || risk.status;
      risk.reviewDate = req.body.reviewDate || risk.reviewDate;

      const updatedRisk = await risk.save();
      res.json(updatedRisk);
    } else {
      res.status(404).json({ message: 'Risk not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error updating risk', error: error.message });
  }
};

// @desc    Delete risk
// @route   DELETE /api/risks/:id
// @access  Private/Admin
const deleteRisk = async (req, res) => {
  try {
    const risk = await Risk.findById(req.params.id);
    if (risk) {
      await risk.remove();
      res.json({ message: 'Risk removed' });
    } else {
      res.status(404).json({ message: 'Risk not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting risk', error: error.message });
  }
};

module.exports = {
  getRisks,
  createRisk,
  updateRisk,
  deleteRisk
};
