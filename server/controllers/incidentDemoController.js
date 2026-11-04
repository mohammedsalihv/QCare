const { row, steps } = require('../utils/incidentDemo');
const Incident = require('../models/Incident');
const { reviewer } = require('../utils/incidentWorkflow');
exports.practice = async (req, res) => {
  if (!reviewer(req.user)) return res.status(403).json({ message: 'A quality reviewer must create the dummy incident.' });
  try {
    const incidentId = 'DEMO-PRACTICE-' + req.user._id;
    const record = await Incident.findOneAndUpdate({ incidentId, isDemo: true, reportedBy: req.user._id }, { $setOnInsert: {
      incidentId, isDemo: true, reportedBy: req.user._id,
      title: 'DUMMY - medicine storage near miss (training only)',
      description: 'Fictional practice incident: two similar medicine packs were found together before administration. No medicine reached a patient. Use this record to practise acceptance, investigation, actions and independent closure.',
      category: 'Clinical', location: 'Training clinic (fictional)', department: 'Training nursing', areaRoom: 'Training treatment room',
      dateOfIncident: new Date(), severity: 'High', harmLevel: 'No harm', status: 'Pending',
      immediateActions: 'Separated the fictional packs, checked the intended medicine and informed the training shift lead.',
      history: [{ event: 'reported', actor: req.user._id, actorName: req.user.employeeName, detail: 'Dummy incident created for training only. No real patient or event.' }]
    } }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }).select('-attachments.data');
    res.set('Cache-Control', 'no-store').json(record);
  } catch (error) {
    // Concurrent requests use the same unique reference and return the existing record.
    if (error.code === 11000) {
      const existing = await Incident.findOne({ incidentId: 'DEMO-PRACTICE-' + req.user._id, isDemo: true, reportedBy: req.user._id }).select('-attachments.data');
      if (existing) return res.set('Cache-Control', 'no-store').json(existing);
    }
    res.status(500).json({ message: 'Could not open the dummy incident.' });
  }
};
exports.detail = (req, res) => res.set('Cache-Control', 'no-store').json({ row, steps });
exports.pdf = async (req, res) => {
  try {
    const report = await require('../utils/incidentPdf')(row);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="DEMO-INC-001.pdf"', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }).send(report);
  } catch { res.status(500).json({ message: 'Could not generate the demo report.' }); }
};
