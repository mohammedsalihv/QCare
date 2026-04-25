const express = require("express");
const {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");
const { protect, admin, superAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getDepartments)
  .post(admin, createDepartment);

router.route("/:id")
  .put(admin, updateDepartment)
  .delete(superAdmin, deleteDepartment);

module.exports = router;
