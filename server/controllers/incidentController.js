const { randomUUID } = require('node:crypto');
const { validateIncidentReport } = require('../utils/incidentReport');
const Incident = require("../models/Incident");
const Notification = require("../models/Notification");

// @desc    Create new incident
// @route   POST /api/incidents
// @access  Private
const createIncident = async (req, res) => {
  try {
    const { title, description, category, location, dateOfIncident, severity } = req.body;

    const details = await validateIncidentReport(req.body, req.files || []);
    const incidentId = 'INC-' + randomUUID().toUpperCase();

    const incident = await Incident.create({
      ...details,
      incidentId,
      title,
      description,
      category,
      location: details.location || location,
      dateOfIncident,
      severity,
      reportedBy: req.user._id,
      history: [{ event: "reported", actor: req.user._id, actorName: req.user.employeeName, detail: "Incident submitted" }],
    });

    try {
    // Create Persistent Notification for Admins
    await Notification.create({
      type: "incident_report",
      message: `New incident reported: ${title}`,
      user: req.user.employeeName,
      userId: req.user._id,
      actionLink: "/dashboard/incidents",
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

    for (const recipientId of details.notifyStaff) {
      await Notification.create({ type:'incident_report', message:'You have been notified about incident ' + incidentId, user:req.user.employeeName, userId:req.user._id, actionLink:'/dashboard/incidents',recipientRole:'user',recipientId });
      req.io?.to(String(recipientId)).emit('new-notification', {type:'incident_report'});
    }
    } catch { console.error('Incident saved, but notification delivery failed for ' + incidentId); }
    const result = incident.toObject(); result.attachments = result.attachments.map(({data,...metadata})=>metadata);
    res.status(201).json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.status ? error.message : "Could not complete incident request." });
  }
};

// @desc    Get incidents (Admin/Superadmin see all, others see own)
// @route   GET /api/incidents
// @access  Private
const getIncidents = async (req, res) => {
  try {
    const query = require("../utils/incidentWorkflow").accessQuery(req.user);

    const incidents = await Incident.find(query).select("-attachments.data")
      .populate("reportedBy", "employeeName employeeId department")
      .populate("involvedStaff notifyStaff", "employeeName employeeId")
      .sort({ createdAt: -1 });

    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createIncident, getIncidents };
