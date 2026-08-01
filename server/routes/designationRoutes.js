const express = require("express");
const {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} = require("../controllers/designationController");
const { protect, admin, superAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getDesignations)
  .post(admin, createDesignation);

router.route("/:id")
  .put(admin, updateDesignation)
  .delete(superAdmin, deleteDesignation);

module.exports = router;
