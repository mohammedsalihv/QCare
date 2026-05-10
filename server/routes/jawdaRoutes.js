const express = require('express');
const router = express.Router();
const jawdaController = require('../controllers/jawdaController');

// AOT Routes
router.get('/aot', jawdaController.getAOTData);
router.post('/aot', jawdaController.addAOTEntry);

// ASD Routes
router.get('/asd', jawdaController.getASDData);
router.post('/asd', jawdaController.addASDEntry);

// BN Routes
router.get('/bn', jawdaController.getBNData);
router.post('/bn', jawdaController.addBNEntry);

// DF Routes
router.get('/df', jawdaController.getDFData);
router.post('/df', jawdaController.addDFEntry);

// KPI Stats
router.get('/kpis', jawdaController.getJawdaKPIs);

module.exports = router;
