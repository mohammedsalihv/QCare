const express = require("express");
const {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} = require("../controllers/locationController");
const { protect, admin, superAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getLocations)
  .post(admin, createLocation);

router.route("/:id")
  .put(admin, updateLocation)
  .delete(superAdmin, deleteLocation);

module.exports = router;
