const JawdaAOT = require('../models/JawdaAOT');
const JawdaASD = require('../models/JawdaASD');
const JawdaBN = require('../models/JawdaBN');
const JawdaDF = require('../models/JawdaDF');

// AOT Controllers
exports.getAOTData = async (req, res) => {
  try {
    const data = await JawdaAOT.find().sort({ transplantDate: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addAOTEntry = async (req, res) => {
  try {
    const entry = new JawdaAOT(req.body);
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// ASD Controllers
exports.getASDData = async (req, res) => {
  try {
    const data = await JawdaASD.find().sort({ referralDate: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addASDEntry = async (req, res) => {
  try {
    const entry = new JawdaASD(req.body);
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// BN Controllers
exports.getBNData = async (req, res) => {
  try {
    const data = await JawdaBN.find().sort({ admissionDate: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addBNEntry = async (req, res) => {
  try {
    const entry = new JawdaBN(req.body);
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DF Controllers
exports.getDFData = async (req, res) => {
  try {
    const data = await JawdaDF.find().sort({ reportingMonth: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addDFEntry = async (req, res) => {
  try {
    const entry = new JawdaDF(req.body);
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// KPI Calculation logic (Simplified for initial build)
exports.getJawdaKPIs = async (req, res) => {
  try {
    // This will be expanded with actual formula logic from requirements
    res.json({ message: "KPI engine initialized" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
