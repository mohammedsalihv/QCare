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
    previousIncidentIds: [{ type: String, trim: true }],
    department: { type: String, default: '' },
    areaRoom: { type: String, default: '' },
    harmLevel: { type: String, enum: ['No harm','Low harm','Moderate harm','Severe harm','Death','Unknown'], default: 'Unknown' },
    witnesses: { type: String, default: '' },
    immediateActions: { type: String, default: '' },
    involvedStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    notifyStaff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    notifyChoice: { type: String, enum: ['', 'Yes', 'No'], default: '' },
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
      enum: ["Pending", "Accepted", "Needs clarification", "Investigating", "Action in progress", "Closure review", "Resolved", "Closed", "Rejected", "Duplicate", "Reopened"],
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
    primaryResponsible: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    secondaryResponsible: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    routingSource: { type: String, default: '' },
    routingReason: { type: String, default: '' },
    opinions: [{
      recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      question: { type: String, required: true },
      requestedAt: { type: Date, default: Date.now },
      response: String,
      respondedAt: Date,
    }],
    findings: {
      type: String,
      default: "",
    },
    actionsTaken: {
      type: String,
      default: "",
    },
    investigationDue: Date,
    rootCause: { type: String, default: '' },
    contributingFactors: { type: String, default: '' },
    operationalImpact: { type: String, default: '' },
    temporaryControls: { type: String, default: '' },
    riskLevel: { type: String, enum: ['', 'Low', 'Medium', 'High', 'Critical'], default: '' },
    likelihood: { type: String, default: '' },
    potentialConsequence: { type: String, default: '' },
    residualRisk: { type: String, enum: ['', 'Low', 'Medium', 'High', 'Critical'], default: '' },
    effectiveness: { type: String, enum: ['', 'Effective', 'Partially effective', 'Ineffective'], default: '' },
    effectivenessEvidence: { type: String, default: '' },
    effectivenessDate: Date,
    closureSummary: { type: String, default: '' },
    closedAt: Date,
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actions: [{
      title: { type: String, required: true },
      kind: { type: String, enum: ['Correction', 'Corrective', 'Preventive'], required: true },
      owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      dueDate: { type: Date, required: true },
      successCriteria: { type: String, required: true },
      completion: String,
      completedAt: Date,
      completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    }],
    comments: [{ body: String, kind: { type: String, enum: ['Comment', 'Witness statement', 'Clarification'], default: 'Comment' }, author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, authorName: String, at: { type: Date, default: Date.now } }],
    deletedAt: Date,
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    history: [{ event: String, detail: String, changes: mongoose.Schema.Types.Mixed, actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, actorName: String, at: { type: Date, default: Date.now } }],
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);
incidentSchema.index({ status: 1, createdAt: -1 });
incidentSchema.index({ reportedBy: 1, createdAt: -1 });
incidentSchema.index({ assignedTo: 1, createdAt: -1 });
incidentSchema.index({ 'actions.owner': 1 });
incidentSchema.index({ notifyStaff: 1 });
incidentSchema.index({ secondaryResponsible: 1 });
incidentSchema.index({ primaryResponsible: 1 });
incidentSchema.index({ 'opinions.recipient': 1 });

module.exports = mongoose.model("Incident", incidentSchema);
