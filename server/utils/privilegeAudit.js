// Snapshot identity and scope on the server; save history with the application.
function auditEntry(user, row, action, previousStatus) {
  return {
    action, occurredAt: new Date(), actorId: user._id,
    actorName: user.employeeName, actorEmployeeId: user.employeeId,
    actorRole: user.role, actorDesignation: user.designation,
    previousStatus, newStatus: row.status,
    notes: action === 'submitted' ? row.reason : row.reviewNotes,
    procedures: row.procedures.map(({ name, level, approved }) => ({ name, level, approved }))
  };
}
module.exports = { auditEntry };
