const IPCSurveillance = require('../models/IPCSurveillance');
const HandHygieneAudit = require('../models/HandHygieneAudit');
const OutbreakAlert = require('../models/OutbreakAlert');
const IPCChecklistSubmission = require('../models/IPCChecklistSubmission');
const Incident = require('../models/Incident');
const Risk = require('../models/Risk');
const AuditLog = require('../models/AuditLog');

// --- Surveillance ---

exports.logSurveillance = async (req, res) => {
  try {
    const data = new IPCSurveillance({ ...req.body, createdBy: req.user._id });
    await data.save();

    // Logic: If rate > benchmark for 2 consecutive months -> Auto-create Risk
    if (data.rate > data.nationalBenchmark) {
      const lastMonth = data.reportingMonth === 1 ? 12 : data.reportingMonth - 1;
      const lastYear = data.reportingMonth === 1 ? data.reportingYear - 1 : data.reportingYear;

      const previousMonthData = await IPCSurveillance.findOne({
        infectionType: data.infectionType,
        ward: data.ward,
        reportingMonth: lastMonth,
        reportingYear: lastYear
      });

      if (previousMonthData && previousMonthData.rate > previousMonthData.nationalBenchmark) {
        // Create Risk entry
        const risk = new Risk({
          riskTitle: `Persistent High HAI Rate: ${data.infectionType} in ${data.ward}`,
          riskCategory: 'clinical',
          description: `HAI rate exceeded national benchmark for 2 consecutive months. Current rate: ${data.rate} (Benchmark: ${data.nationalBenchmark})`,
          department: data.ward,
          likelihood: 4,
          impact: 4, // High risk
          status: 'open',
          identifiedBy: req.user._id
        });
        await risk.save();
        
        await AuditLog.create({
          action: 'AUTO_RISK_GENERATED',
          module: 'IPC',
          details: `Risk generated due to persistent high HAI rate for ${data.infectionType}`,
          user: 'IPC System',
          userId: req.user._id
        });
      }
    }

    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSurveillance = async (req, res) => {
  try {
    const { year, infectionType, ward } = req.query;
    let query = {};
    if (year) query.reportingYear = parseInt(year);
    if (infectionType) query.infectionType = infectionType;
    if (ward) query.ward = ward;

    const results = await IPCSurveillance.find(query).sort({ reportingYear: -1, reportingMonth: -1 });
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getSurveillanceDashboard = async (req, res) => {
  try {
    // Last 12 months trend for Recharts
    const trend = await IPCSurveillance.find()
      .sort({ reportingYear: -1, reportingMonth: -1 })
      .limit(24); // Get enough for comparison

    const ratesByInfection = await IPCSurveillance.aggregate([
      { $group: { _id: "$infectionType", avgRate: { $avg: "$rate" }, count: { $sum: 1 } } }
    ]);

    res.json({ trend, ratesByInfection });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Hand Hygiene ---

exports.submitHandHygieneAudit = async (req, res) => {
  try {
    const audit = new HandHygieneAudit({ ...req.body, auditedBy: req.user._id });
    await audit.save();
    res.status(201).json(audit);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getHandHygieneTrend = async (req, res) => {
  try {
    const { ward } = req.query;
    let query = {};
    if (ward) query.ward = ward;

    const trend = await HandHygieneAudit.aggregate([
      { $match: query },
      { 
        $group: { 
          _id: { month: { $month: "$auditDate" }, year: { $year: "$auditDate" } },
          avgCompliance: { $avg: "$complianceRate" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    res.json(trend);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Outbreaks ---

exports.createOutbreak = async (req, res) => {
  try {
    const alert = new OutbreakAlert({ 
      ...req.body, 
      createdBy: req.user._id,
      timeline: [{ event: 'Outbreak Suspected & Logged', recordedBy: req.user._id }]
    });
    await alert.save();

    // Auto-link to Incident
    const incident = new Incident({
      title: `Outbreak Alert: ${alert.infectionType} in ${alert.affectedWard}`,
      description: `Suspected outbreak of ${alert.infectionType}. Ref: ${alert.alertRef}`,
      category: 'Clinical',
      severity: 'High',
      status: 'Reported',
      reportedBy: req.user._id,
      dateOfIncident: alert.alertDate
    });
    await incident.save();

    alert.linkedIncidents.push(incident._id);
    await alert.save();

    res.status(201).json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getOutbreaks = async (req, res) => {
  try {
    const outbreaks = await OutbreakAlert.find()
      .populate('investigationTeam', 'employeeName')
      .sort({ createdAt: -1 });
    res.json(outbreaks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOutbreakById = async (req, res) => {
  try {
    const alert = await OutbreakAlert.findById(req.params.id)
      .populate('timeline.recordedBy', 'employeeName')
      .populate('investigationTeam', 'employeeName');
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addOutbreakEvent = async (req, res) => {
  try {
    const alert = await OutbreakAlert.findById(req.params.id);
    alert.timeline.push({
      event: req.body.event,
      recordedBy: req.user._id
    });
    if (req.body.currentCaseCount) alert.currentCaseCount = req.body.currentCaseCount;
    await alert.save();
    res.json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.notifyDOHOutbreak = async (req, res) => {
  try {
    const alert = await OutbreakAlert.findByIdAndUpdate(req.params.id, {
      notifiedToDOH: true,
      notificationDate: new Date(),
      $push: { timeline: { event: 'Notified to DOH Abu Dhabi', recordedBy: req.user._id } }
    }, { new: true });

    await AuditLog.create({
      action: 'OUTBREAK_NOTIFIED_DOH',
      module: 'IPC',
      details: `Outbreak ${alert.alertRef} notified to DOH`,
      user: req.user.employeeName,
      userId: req.user._id
    });

    res.json(alert);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- Checklists ---

exports.submitChecklist = async (req, res) => {
  try {
    const submission = new IPCChecklistSubmission({ ...req.body, submittedBy: req.user._id });
    await submission.save();
    res.status(201).json(submission);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getChecklistSummary = async (req, res) => {
  try {
    const summary = await IPCChecklistSubmission.aggregate([
      { $group: { _id: { type: "$checklistType", ward: "$ward" }, avgCompliance: { $avg: "$overallCompliance" } } }
    ]);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
