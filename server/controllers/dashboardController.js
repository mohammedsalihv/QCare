const User = require('../models/users');
const KPIIndicator = require('../models/KPIIndicator');
const counts = [
  ['departments', require('../models/department')],
  ['specialties', require('../models/Specialty')],
  ['locations', require('../models/Location')],
  ['designations', require('../models/Designation')],
  ['documents', require('../models/Document')],
  ['incidents', require('../models/Incident')],
  ['risks', require('../models/Risk')],
  ['clinicalAudits', require('../models/ClinicalAudit')],
  ['correctiveActions', require('../models/Capa')],
  ['changeRequests', require('../models/ChangeRequest')],
  ['deviations', require('../models/Deviation')],
  ['indicatorReports', KPIIndicator],
  ['trainingRecords', require('../models/TrainingRecord')],
  ['competencies', require('../models/CompetencyFramework')],
  ['staffLicenses', require('../models/StaffLicense')],
  ['facilityLicenses', require('../models/FacilityLicense')],
  ['clinicalPrivileges', require('../models/ClinicalPrivilege')],
  ['equipment', require('../models/EquipmentAsset')],
  ['suppliers', require('../models/Supplier')],
  ['maintenanceRecords', require('../models/MaintenanceLog')],
  ['complaints', require('../models/Complaint')],
  ['patientSurveys', require('../models/PatientSurvey')],
  ['medicationErrors', require('../models/MedicationError')],
  ['handHygieneAudits', require('../models/HandHygieneAudit')],
  ['infectionSurveillance', require('../models/IPCSurveillance')],
];

// Return aggregate counts only; never send user profiles or patient records.
exports.getOverview = async (req, res) => {
  const jobs = counts.map(([key, model]) => [key, () => model.countDocuments({}).maxTimeMS(8000)]);
  jobs.push(['indicators', async () => {
    const rows = await KPIIndicator.aggregate([{ $match: { indicatorCode: { $type: 'string', $ne: '' } } }, { $group: { _id: '$indicatorCode' } }, { $count: 'total' }]).option({ maxTimeMS: 8000 });
    return rows[0]?.total || 0;
  }]);
  jobs.push(['users', async () => {
    const rows = await User.aggregate([
      { $project: { isActive: 1, accountStatus: { $toLower: { $ifNull: ['$status', 'active'] } }, department: { $trim: { input: { $ifNull: ['$department', ''] } } } } },
      { $facet: {
        totals: [{ $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: [{ $and: [{ $ne: ['$isActive', false] }, { $not: [{ $in: ['$accountStatus', ['inactive', 'blocked']] }] }] }, 1, 0] } }, blocked: { $sum: { $cond: [{ $eq: ['$accountStatus', 'blocked'] }, 1, 0] } } } }],
        byDepartment: [{ $group: { _id: { $toLower: '$department' }, name: { $first: '$department' }, count: { $sum: 1 } } }, { $sort: { count: -1, name: 1 } }, { $project: { _id: 0, name: { $cond: [{ $eq: ['$name', ''] }, 'Unassigned', '$name'] }, count: 1 } }],
      } },
    ]).option({ maxTimeMS: 8000 });
    const result = rows[0] || {};
    const totals = result.totals?.[0] || { total: 0, active: 0, blocked: 0 };
    return { total: totals.total, statuses: [{ name: 'Active', count: totals.active }, { name: 'Inactive', count: totals.total - totals.active - totals.blocked }, { name: 'Blocked', count: totals.blocked }], byDepartment: result.byDepartment || [] };
  }]);
  const results = await Promise.allSettled(jobs.map(([, job]) => Promise.resolve().then(job)));
  const totals = {};
  const unavailable = [];
  let users = null;
  results.forEach((result, index) => {
    const key = jobs[index][0];
    if (result.status === 'rejected') { totals[key] = null; unavailable.push(key); return; }
    if (key === 'users') { users = result.value; totals.users = users.total; }
    else totals[key] = result.value;
  });
  res.set('Cache-Control', 'no-store');
  res.json({ counts: totals, users, unavailable, generatedAt: new Date().toISOString() });
};
