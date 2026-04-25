const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpiController');

router.post('/', kpiController.createKPI);
router.get('/', kpiController.getAllKPIs);
router.get('/:id', kpiController.getKPIById);
router.put('/:id', kpiController.updateKPI);
router.delete('/:id', kpiController.deleteKPI);

module.exports = router;