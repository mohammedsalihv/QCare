const ClinicalPrivilege = require('../models/ClinicalPrivilege');

// Application context is current information, not a reconstructed historical event.
module.exports = async function privilegeAuditContext(rows) {
  const ids = [...new Set(rows.filter(row => row.moduleKey === 'privileges' && /^[a-f\d]{24}$/i.test(row.recordId || '')).map(row => row.recordId))];
  if (!ids.length) return rows;
  const applications = await ClinicalPrivilege.find({ _id: { $in: ids } })
    .select('staffId specialty applicationType assignedApprover')
    .populate('staffId assignedApprover', 'employeeName').lean();
  const byId = new Map(applications.map(row => [String(row._id), row]));
  return rows.map(row => {
    const application = row.moduleKey === 'privileges' && byId.get(row.recordId);
    return application ? { ...row, applicationContext: {
      clinician: application.staffId?.employeeName || '',
      specialty: application.specialty,
      requestType: application.applicationType,
      assignedApprover: application.assignedApprover?.employeeName || ''
    } } : row;
  });
};
