const KPI = require('../models/KPI');

exports.createKPI = async (req, res) => {
  try {
    const kpi = new KPI(req.body);
    await kpi.save();
    res.status(201).json(kpi);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllKPIs = async (req, res) => {
  try {
    const kpis = await KPI.find().populate('department', 'name code');
    res.status(200).json(kpis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getKPIById = async (req, res) => {
  try {
    const kpi = await KPI.findById(req.params.id).populate('department', 'name code');
    if (!kpi) return res.status(404).json({ message: 'KPI not found' });
    res.status(200).json(kpi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateKPI = async (req, res) => {
  try {
    const kpi = await KPI.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('department', 'name code');
    if (!kpi) return res.status(404).json({ message: 'KPI not found' });
    res.status(200).json(kpi);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteKPI = async (req, res) => {
  try {
    const kpi = await KPI.findByIdAndDelete(req.params.id);
    if (!kpi) return res.status(404).json({ message: 'KPI not found' });
    res.status(200).json({ message: 'KPI deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};