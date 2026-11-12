const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const AuditLog = require('../models/AuditLog');
const { modules, allowed } = require('../utils/requestAudit');
router.use(protect);
router.get('/modules', (req, res) => res.json(modules.filter(module => allowed(req.user, module))));
router.get('/', async (req, res) => {
  const permitted = modules.filter(module => allowed(req.user, module));
  if (!permitted.length) return res.status(403).json({ message: 'Audit logs are restricted to authorized reviewers.' });
  const selected = req.query.module;
  if (selected && !permitted.some(module => module.key === selected)) return res.status(403).json({ message: 'You cannot access this module audit log.' });
  try {
    const query = { source: 'server-request', moduleKey: { $in: selected ? [selected] : permitted.map(module => module.key) } };
    if (req.query.search) {
      if (typeof req.query.search !== 'string' || req.query.search.length > 100) return res.status(400).json({ message: 'Search must be under 100 characters.' });
      const regex = { $regex: req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      query.$or = ['actorName', 'actorEmployeeId', 'recordId', 'ipAddress', 'activity', 'path', 'requestId'].map(key => ({ [key]: regex }));
    }
    if (req.query.status) {
      if (!['Success', 'Failed', 'Denied', 'Interrupted', 'Pending'].includes(req.query.status)) return res.status(400).json({ message: 'Invalid outcome.' });
      query.outcome = req.query.status;
    }
    const page = Math.max(1, Math.min(100000, parseInt(req.query.page, 10) || 1)), limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
    const sortBy = ['timestamp', 'module', 'actorName', 'outcome'].includes(req.query.sortBy) ? req.query.sortBy : 'timestamp';
    const [rows, total] = await Promise.all([AuditLog.find(query).sort({ [sortBy]: req.query.direction === 'asc' ? 1 : -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(), AuditLog.countDocuments(query)]);
    const enrichedRows = await require('../utils/privilegeAuditContext')(rows);
    res.set('Cache-Control', 'no-store').json({ rows: enrichedRows, total, page, limit });
  } catch { res.status(500).json({ message: 'Could not load audit records.' }); }
});
module.exports = router;
