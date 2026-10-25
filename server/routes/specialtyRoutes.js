const router = require('express').Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getSpecialties, createSpecialty, updateSpecialty, deleteSpecialty } = require('../controllers/specialtyController');
router.use(protect);
router.route('/').get(getSpecialties).post(admin, createSpecialty);
router.route('/:id').put(admin, updateSpecialty).delete(admin, deleteSpecialty);
module.exports = router;
