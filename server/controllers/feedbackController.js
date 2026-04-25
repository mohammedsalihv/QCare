const Feedback = require('../models/Feedback');

// @desc    Get all feedback
// @route   GET /api/feedback
// @access  Private/Admin
const getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({}).populate('assignedTo', 'employeeName email');
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback', error: error.message });
  }
};

// @desc    Create new feedback
// @route   POST /api/feedback
// @access  Private
const createFeedback = async (req, res) => {
  try {
    const { patientName, contact, department, type, content } = req.body;
    
    const feedback = new Feedback({
      patientName,
      contact,
      department,
      type,
      content
    });

    const createdFeedback = await feedback.save();
    res.status(201).json(createdFeedback);
  } catch (error) {
    res.status(400).json({ message: 'Error creating feedback', error: error.message });
  }
};

// @desc    Update feedback
// @route   PUT /api/feedback/:id
// @access  Private/Admin
const updateFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (feedback) {
      feedback.status = req.body.status || feedback.status;
      feedback.assignedTo = req.body.assignedTo || feedback.assignedTo;
      feedback.resolution = req.body.resolution || feedback.resolution;
      feedback.department = req.body.department || feedback.department;
      feedback.type = req.body.type || feedback.type;

      const updatedFeedback = await feedback.save();
      res.json(updatedFeedback);
    } else {
      res.status(404).json({ message: 'Feedback not found' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error updating feedback', error: error.message });
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private/Admin
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (feedback) {
      await feedback.remove();
      res.json({ message: 'Feedback removed' });
    } else {
      res.status(404).json({ message: 'Feedback not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error deleting feedback', error: error.message });
  }
};

module.exports = {
  getFeedbacks,
  createFeedback,
  updateFeedback,
  deleteFeedback
};
