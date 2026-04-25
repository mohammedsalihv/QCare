const mongoose = require('mongoose');

const kpiSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Please add a KPI name'],
    trim: true
  },
  category: { 
    type: String, 
    required: [true, 'Please specify a category'],
    enum: ['Clinical', 'Operational', 'Financial', 'Patient Experience', 'Staff Safety'],
    default: 'Clinical'
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Please assign a department']
  },
  actualValue: { 
    type: Number, 
    required: [true, 'Actual value is required'],
    default: 0
  },
  targetValue: { 
    type: Number, 
    required: [true, 'Target value is required'],
    default: 0
  },
  unit: { 
    type: String, 
    required: [true, 'Unit of measurement is required'],
    default: '%' 
  },
  period: { 
    type: String, 
    enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'], 
    default: 'Monthly' 
  },
  description: { 
    type: String 
  },
  status: {
    type: String,
    enum: ['On Track', 'Off Track', 'Critical', 'Not Started'],
    default: 'Not Started'
  }
}, { timestamps: true });

module.exports = mongoose.model('KPI', kpiSchema);