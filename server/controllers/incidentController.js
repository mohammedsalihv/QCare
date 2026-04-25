const Incident = require("../models/Incident");
const Notification = require("../models/Notification");

// @desc    Create new incident
// @route   POST /api/incidents
// @access  Private
const createIncident = async (req, res) => {
  try {
    const { title, description, category, location, dateOfIncident, severity } = req.body;

    // Generate unique ID starting with CMCINC
    const count = await Incident.countDocuments();
    const incidentId = `CMCINC-${(count + 1).toString().padStart(4, '0')}`;

    const incident = await Incident.create({
      incidentId,
      title,
      description,
      category,
      location,
      dateOfIncident,
      severity,
      reportedBy: req.user._id,
    });

    // Create Persistent Notification for Admins
    await Notification.create({
      type: "incident_report",
      message: `New incident reported: ${title}`,
      user: req.user.employeeName,
      userId: req.user._id,
      actionLink: "/incidents",
      recipientRole: "admin"
    });

    // Create Persistent Notification for the Reporter
    await Notification.create({
      type: "incident_report",
      message: `You reported a new incident: ${title}`,
      user: req.user.employeeName,
      userId: req.user._id,
      actionLink: "/dashboard/incidents",
      recipientRole: "user",
      recipientId: req.user._id
    });

    // Emit Socket Notification to Admins
    if (req.io) {
      req.io.to("admins").emit("new-notification", {
        type: "incident_report",
        message: `New incident reported: ${title}`,
        user: req.user.employeeName,
        time: new Date()
      });
    }

    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get incidents (Admin/Superadmin see all, others see own)
// @route   GET /api/incidents
// @access  Private
const getIncidents = async (req, res) => {
  try {
    let query = {};

    // If not admin/superadmin, only show own reported incidents
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      query = { reportedBy: req.user._id };
    }

    const incidents = await Incident.find(query)
      .populate("reportedBy", "employeeName employeeId department")
      .sort({ createdAt: -1 });

    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update incident status/findings (Admin/Superadmin only)
// @route   PATCH /api/incidents/:id
// @access  Private/Admin
const updateIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    // Role check for updating (only admins can update status/findings)
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
      return res.status(403).json({ message: "Not authorized to update incidents" });
    }

    const { status, severity, findings, actionsTaken } = req.body;

    incident.status = status || incident.status;
    incident.severity = severity || incident.severity;
    incident.findings = findings || incident.findings;
    incident.actionsTaken = actionsTaken || incident.actionsTaken;

    const updatedIncident = await incident.save();

    // Notify the reporter
    await Notification.create({
      type: "system_alert",
      message: `Your incident report ${incident.incidentId} has been updated to: ${incident.status}`,
      user: "System Admin",
      userId: req.user._id, // Admin who updated it
      actionLink: "/dashboard/incidents",
      recipientRole: "user",
      recipientId: incident.reportedBy
    });

    // Emit socket event to the reporter
    if (req.io) {
      req.io.to(incident.reportedBy.toString()).emit("new-notification", {
        type: "system_alert",
        message: `Your incident report ${incident.incidentId} has been updated to: ${incident.status}`,
        user: "System Admin",
        time: new Date()
      });
    }

    res.json(updatedIncident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createIncident,
  getIncidents,
  updateIncident,
};
