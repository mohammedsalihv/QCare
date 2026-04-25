const express = require("express");
const router = express.Router();
const {
  createIncident,
  getIncidents,
  updateIncident,
} = require("../controllers/incidentController");
const { protect, admin } = require("../middleware/authMiddleware");

router.route("/")
  .post(protect, createIncident)
  .get(protect, getIncidents);

router.route("/:id")
  .patch(protect, updateIncident);

module.exports = router;
