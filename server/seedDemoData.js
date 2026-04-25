const mongoose = require('mongoose');
const Risk = require('./models/Risk');
const Audit = require('./models/Audit');
const Feedback = require('./models/Feedback');
const User = require('./models/users');
const Department = require('./models/department');

const MONGO_URL = 'mongodb://localhost:27017/QCare';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB for seeding...');

    const user = await User.findOne();
    if (!user) {
      console.log('No user found to assign records to. Please register a user first.');
      process.exit();
    }

    const dept = await Department.findOne();
    const deptName = dept ? dept.name : 'Quality Department';

    // Clear existing demo data (optional, but good for "clean" demo)
    await Risk.deleteMany({ title: { $regex: 'DEMO' } });
    await Audit.deleteMany({ title: { $regex: 'DEMO' } });
    await Feedback.deleteMany({ patientName: { $regex: 'DEMO' } });

    // Seed Risk
    await Risk.create({
      title: 'DEMO: Potential Failure of Redundant Backup Power',
      description: 'The OT backup generator has shown intermittent delay in switching during recent tests.',
      category: 'Operational',
      department: deptName,
      probability: 2,
      impact: 5,
      score: 10,
      mitigationStrategy: 'Immediate inspection by biomedical engineering. Install secondary UPS for critical life-support systems.',
      owner: user._id,
      identifiedBy: user._id,
      status: 'Identified',
      reviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    // Seed Audit
    await Audit.create({
      title: 'DEMO: Quarterly Infection Control Audit',
      department: deptName,
      auditDate: new Date(),
      auditor: user._id,
      status: 'Completed',
      checklist: [
        { item: 'Hand Hygiene Compliance', status: 'Compliant', observations: '95% compliance observed during peak hours.' },
        { item: 'Waste Segregation', status: 'Non-Compliant', observations: 'Sharp bins found overfilled in Ward 3.' },
        { item: 'Sterilization Logs', status: 'Compliant', observations: 'All logs up to date.' }
      ],
      summary: 'Overall compliance is high, but waste management needs immediate training in specific wards.',
      recommendations: 'Conduct mandatory 15-min refresher for Ward 3 staff on sharps safety.'
    });

    // Seed Feedback
    await Feedback.create({
      patientName: 'DEMO: Sarah Ahmad',
      contact: '+971 50 123 4567',
      department: deptName,
      type: 'Complaint',
      content: 'Waited for more than 45 minutes at the reception desk before being attended to.',
      status: 'Under Investigation',
      assignedTo: user._id,
      resolution: 'Checking CCTV and staff schedules to identify bottleneck.'
    });

    console.log('Demo data seeded successfully!');
    process.exit();
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
