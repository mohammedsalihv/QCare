const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
    department: { type: String, default: '' },
    areaRoom: { type: String, default: '' },
    harmLevel: { type: String, enum: ['No harm','Low harm','Moderate harm','Severe harm','Death','Unknown'], default: 'Unknown' },
    witnesses: { type: String, default: '' },
    immediateActions: { type: String, default: '' },
    involvedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    notifyStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    attachments: [{ name: String, mime: String, data: { type: Buffer, select: false }, size: Number }],
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Clinical", "Safety", "Administrative", "Technical", "Other"],
    },
    location: {
      type: String,
      required: true,
    },
    dateOfIncident: {
      type: Date,
      required: true,
    },
    severity: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Investigating", "Resolved", "Closed"],
      default: "Pending",
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    findings: {
      type: String,
      default: "",
    },
    actionsTaken: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Incident", incidentSchema);
