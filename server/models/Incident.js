const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
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
