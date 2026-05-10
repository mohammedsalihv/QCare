const mongoose = require('mongoose');

const riskSchema = new mongoose.Schema({
  riskId: {
    type: String,
    unique: true
  },
  riskTitle: {
    type: String,
    required: [true, 'Risk title is required'],
    trim: true
  },
  riskTitle_ar: {
    type: String
  },
  riskCategory: {
    type: String,
    required: true,
    enum: ['clinical', 'operational', 'financial', 'compliance', 'reputational', 'information-security', 'infrastructure']
  },
  description: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  identifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  identifiedDate: {
    type: Date,
    default: Date.now
  },
  likelihood: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  impact: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  riskScore: {
    type: Number
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  mitigationPlan: {
    type: String
  },
  mitigationDeadline: {
    type: Date
  },
  residualLikelihood: {
    type: Number,
    min: 1,
    max: 5
  },
  residualImpact: {
    type: Number,
    min: 1,
    max: 5
  },
  residualScore: {
    type: Number
  },
  residualLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical']
  },
  reviewDate: {
    type: Date
  },
  reviewFrequency: {
    type: String,
    enum: ['monthly', 'quarterly', 'annual'],
    default: 'quarterly'
  },
  status: {
    type: String,
    enum: ['open', 'mitigating', 'accepted', 'closed', 'overdue'],
    default: 'open'
  },
  acceptanceReason: {
    type: String
  },
  linkedIncidents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Incident'
  }],
  linkedAudits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClinicalAudit'
  }],
  reviews: [{
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewDate: { type: Date, default: Date.now },
    notes: String,
    updatedLikelihood: Number,
    updatedImpact: Number,
    updatedScore: Number
  }],
  attachments: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Helper to calculate level from score
const getLevel = (score) => {
  if (score >= 15) return 'critical';
  if (score >= 10) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
};

// Pre-save hook to calculate scores and levels
riskSchema.pre('save', async function(next) {
  // Generate riskId if not exists
  if (this.isNew) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Risk').countDocuments();
    this.riskId = `RISK-${year}-${(count + 1).toString().padStart(3, '0')}`;
  }

  // Inherent Score
  this.riskScore = this.likelihood * this.impact;
  this.riskLevel = getLevel(this.riskScore);

  // Residual Score
  if (this.residualLikelihood && this.residualImpact) {
    this.residualScore = this.residualLikelihood * this.residualImpact;
    this.residualLevel = getLevel(this.residualScore);
  }

  // Check if overdue
  if (this.status !== 'closed' && this.reviewDate && this.reviewDate < new Date()) {
    this.status = 'overdue';
  }

  next();
});

module.exports = mongoose.model('Risk', riskSchema);
