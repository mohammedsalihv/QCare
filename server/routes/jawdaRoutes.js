const express = require('express');
const router = express.Router();
const jawdaController = require('../controllers/jawdaController');

// AOT Routes
router.get('/aot', jawdaController.getAOTData);
router.post('/aot', jawdaController.addAOTEntry);

// ASD Routes
router.get('/asd', jawdaController.getASDData);
router.post('/asd', jawdaController.addASDEntry);

// KPI Stats
router.get('/kpis', jawdaController.getJawdaKPIs);

module.exports = router;
