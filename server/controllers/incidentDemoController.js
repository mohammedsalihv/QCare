const { row, steps } = require('../utils/incidentDemo');
exports.detail = (req, res) => res.set('Cache-Control', 'no-store').json({ row, steps });
exports.pdf = async (req, res) => {
  try {
    const report = await require('../utils/incidentPdf')(row);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="DEMO-INC-001.pdf"', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }).send(report);
  } catch { res.status(500).json({ message: 'Could not generate the demo report.' }); }
};
