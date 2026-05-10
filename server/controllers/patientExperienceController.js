const Complaint = require('../models/Complaint');
const PatientSurvey = require('../models/PatientSurvey');
const Incident = require('../models/Incident');
const AuditLog = require('../models/AuditLog');

// --- Complaints ---

exports.createComplaint = async (req, res) => {
  try {
    const complaint = new Complaint({ ...req.body, createdBy: req.user._id });
    await complaint.save();

    // Auto-create incident for high/critical
    if (['high', 'critical'].includes(complaint.severity)) {
      const incident = new Incident({
        title: `Incident triggered by Complaint: ${complaint.complaintRef}`,
        description: `Patient Complaint Reference: ${complaint.complaintRef}. Details: ${complaint.description}`,
        category: 'Clinical',
        severity: complaint.severity === 'critical' ? 'Critical' : 'High',
        status: 'Reported',
        reportedBy: req.user._id,
        dateOfIncident: complaint.dateReceived
      });
      await incident.save();
      complaint.linkedIncident = incident._id;
      await complaint.save();
    }

    res.status(201).json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getComplaints = async (req, res) => {
  try {
    const { status, category, severity, department } = req.query;
    let query = {};
    if (status) query.status = status;
    if (category) query.category = category;
    if (severity) query.severity = severity;
    if (department) query.department = department;

    const complaints = await Complaint.find(query)
      .populate('assignedTo', 'employeeName')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('assignedTo', 'employeeName')
      .populate('actionsTaken.takenBy', 'employeeName')
      .populate('linkedIncident');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acknowledgeComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, {
      status: 'acknowledged',
      acknowledgmentDate: new Date(),
      acknowledgmentSentAt: new Date(),
      $push: {
        actionsTaken: {
          action: 'Acknowledgment sent to patient',
          takenBy: req.user._id,
          takenAt: new Date()
        }
      }
    }, { new: true });
    res.json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateComplaint = async (req, res) => {
  try {
    const { status, actionNote } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (status) complaint.status = status;
    if (actionNote) {
      complaint.actionsTaken.push({
        action: actionNote,
        takenBy: req.user._id,
        takenAt: new Date()
      });
    }

    await complaint.save();
    res.json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.resolveComplaint = async (req, res) => {
  try {
    const { resolutionSummary, patientSatisfied } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, {
      status: 'resolved',
      resolutionDate: new Date(),
      resolutionSummary,
      patientSatisfied,
      patientNotifiedAt: new Date()
    }, { new: true });
    res.json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.escalateComplaint = async (req, res) => {
  try {
    const { escalationReason } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, {
      status: 'escalated',
      escalatedToDOH: true,
      escalationDate: new Date(),
      escalationReason
    }, { new: true });

    await AuditLog.create({
      action: 'ESCALATE_COMPLAINT',
      module: 'PatientExperience',
      details: `Complaint ${complaint.complaintRef} escalated to DOH. Reason: ${escalationReason}`,
      user: req.user.employeeName,
      userId: req.user._id
    });

    res.json(complaint);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const total = await Complaint.countDocuments();
    const open = await Complaint.countDocuments({ status: { $in: ['open', 'acknowledged', 'investigating'] } });
    const resolved = await Complaint.countDocuments({ status: 'resolved' });
    const escalated = await Complaint.countDocuments({ status: 'escalated' });
    
    // Average resolution time
    const resolvedComplaints = await Complaint.find({ status: 'resolved', resolutionDate: { $exists: true } });
    const avgResTime = resolvedComplaints.length > 0 
      ? (resolvedComplaints.reduce((acc, c) => acc + (c.resolutionDate - c.dateReceived), 0) / resolvedComplaints.length / (1000 * 60 * 60 * 24)).toFixed(1)
      : 0;

    const categories = await Complaint.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    res.json({ total, open, resolved, escalated, avgResTime, categories });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Surveys ---

exports.generateSurveyToken = async (req, res) => {
  try {
    const survey = new PatientSurvey({ facilityId: 'QCare-Clinic' });
    await survey.save();
    res.json({ 
      token: survey.surveyToken, 
      link: `${process.env.CLIENT_URL}/public/survey/${survey.surveyToken}` 
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSurveyByToken = async (req, res) => {
  try {
    const survey = await PatientSurvey.findOne({ surveyToken: req.params.token });
    if (!survey) return res.status(404).json({ message: 'Invalid survey link' });
    if (survey.isUsed) return res.status(400).json({ message: 'Survey already submitted' });
    res.json({ facility: 'QCare Clinic', type: 'Patient Satisfaction' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitSurvey = async (req, res) => {
  try {
    const survey = await PatientSurvey.findOne({ surveyToken: req.params.token });
    if (!survey || survey.isUsed) return res.status(400).json({ message: 'Invalid or used token' });

    Object.assign(survey, req.body);
    survey.isUsed = true;
    survey.submittedAt = new Date();
    await survey.save();
    res.json({ message: 'Thank you for your feedback!' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSurveyResults = async (req, res) => {
  try {
    const results = await PatientSurvey.aggregate([
      { $match: { isUsed: true } },
      { 
        $group: { 
          _id: null,
          avgOverall: { $avg: "$overallRating" },
          avgCleanliness: { $avg: "$cleanlinessRating" },
          avgCommunication: { $avg: "$staffCommunicationRating" },
          avgWaiting: { $avg: "$waitingTimeRating" },
          recommendCount: { $sum: { $cond: ["$wouldRecommend", 1, 0] } },
          total: { $sum: 1 }
        }
      }
    ]);

    const recentComments = await PatientSurvey.find({ isUsed: true, comments: { $ne: '' } })
      .sort({ submittedAt: -1 })
      .limit(10);

    res.json({ aggregate: results[0] || {}, recentComments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
