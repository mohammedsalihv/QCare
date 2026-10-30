const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["incident_report", "document_upload", "document_endorsement", "document_like", "user_onboarded", "system_alert", "license-expiry"],
    },
    message: {
      type: String,
      required: true,
    },
    user: {
      type: String, // Name of the user who performed the action
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actionLink: {
      type: String, // Link to the specific item (e.g. /incidents or /documents)
    },
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    deletedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    recipientRole: {
      type: String,
      enum: ["admin", "superadmin", "qualitymanager", "all", "user"],
      default: "admin",
    },
    recipientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    recipientRoles: [String],
    workflow: { module: String, recordId: String, title: String, status: String, reason: String,
      actor: { id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, name: String },
      requester: { id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, name: String }, occurredAt: Date },
    sourceKey: { type: String, unique: true, sparse: true },
    resolvedAt: Date,
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
