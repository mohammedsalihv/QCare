const ChangeRequest = require('../models/ChangeRequest');
const Deviation = require('../models/Deviation');
const Capa = require('../models/Capa');
const Supplier = require('../models/Supplier');
const AuditLog = require('../models/AuditLog');

// Helper to generate unique IDs
const generateId = (prefix) => {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
};

// --- Change Request Controller ---

exports.getChangeRequests = async (req, res) => {
  try {
    let list = await ChangeRequest.find().populate('requestedBy', 'employeeName').sort({ createdAt: -1 });
    
    // Auto-seed if empty
    if (list.length === 0) {
      const demoData = [
        {
          changeId: 'MOC-1092',
          title: 'Implement Electronic Prescription Module',
          description: 'Transitioning clinical oncology division from paper prescriptions to the EMR prescription module to reduce transcription errors.',
          reason: 'Enhanced safety, reduction of dosage errors, and direct integration with pharma registry.',
          department: 'Oncology',
          priority: 'High',
          impactAssessment: {
            clinical: 'Highly positive - eliminates handwritten prescription errors.',
            operational: 'Requires 4 hours of training per staff nurse and physician.',
            financial: 'Within EMR annual licensing budget.'
          },
          status: 'Pending Approval',
          requestedBy: req.user._id
        },
        {
          changeId: 'MOC-1021',
          title: 'Upgrade ICU Backup Power UPS',
          description: 'Replacing older 10kVA UPS in ICU Ward A with a modern 20kVA unit to ensure continuous monitoring and ventilator support.',
          reason: 'Older UPS has shown battery degradation during weekly load tests.',
          department: 'Biomedical & ICU',
          priority: 'Critical',
          impactAssessment: {
            clinical: 'Critical for patient life support continuity during grid transfers.',
            operational: 'Requires temporary scheduling of alternative power source during the 2-hour installation window.',
            financial: 'Allocated in annual facility safety capital budget.'
          },
          status: 'Approved',
          requestedBy: req.user._id
        }
      ];
      await ChangeRequest.insertMany(demoData);
      list = await ChangeRequest.find().populate('requestedBy', 'employeeName').sort({ createdAt: -1 });
    }
    
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createChangeRequest = async (req, res) => {
  try {
    const changeId = generateId('MOC');
    const change = new ChangeRequest({
      ...req.body,
      changeId,
      requestedBy: req.user._id
    });
    await change.save();
    
    await AuditLog.create({
      action: 'CHANGE_REQUEST_CREATED',
      module: 'QMS_ChangeManagement',
      details: `Change Request ${changeId} logged: ${change.title}`,
      user: req.user.employeeName,
      userId: req.user._id
    });

    res.status(201).json(change);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateChangeRequest = async (req, res) => {
  try {
    const change = await ChangeRequest.findById(req.params.id);
    if (!change) {
      return res.status(404).json({ message: 'Change request not found' });
    }
    
    // If status is updated to Approved/Rejected, track who approved it
    if (req.body.status && ['Approved', 'Rejected'].includes(req.body.status)) {
      change.approvedBy = req.user._id;
    }
    
    Object.assign(change, req.body);
    await change.save();

    await AuditLog.create({
      action: 'CHANGE_REQUEST_UPDATED',
      module: 'QMS_ChangeManagement',
      details: `Change Request ${change.changeId} status set to ${change.status}`,
      user: req.user.employeeName,
      userId: req.user._id
    });

    res.json(change);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- Deviation / Non-Conformance Controller ---

exports.getDeviations = async (req, res) => {
  try {
    let list = await Deviation.find().populate('identifiedBy', 'employeeName').sort({ createdAt: -1 });
    
    // Auto-seed if empty
    if (list.length === 0) {
      const demoData = [
        {
          deviationId: 'DEV-8821',
          title: 'Incorrect storage temperature for vaccine batch V-2201',
          description: 'Refrigeration unit #4 temp rose to 11°C (limit is 2-8°C) for 3 hours due to door seal failure.',
          category: 'Clinical',
          severity: 'Major',
          immediateAction: 'Moved vaccine stock to alternate vaccine fridge. Flagged the batch for inspection.',
          status: 'Under Investigation',
          identifiedBy: req.user._id
        },
        {
          deviationId: 'DEV-8890',
          title: 'Emergency exit blocked in Laboratory Corridor',
          description: 'Two crates of bulk liquid reagents were temporarily left blocking the lab emergency exit.',
          category: 'Safety',
          severity: 'Critical',
          immediateAction: 'Instructed janitor to immediately move the boxes to the designated storage vault.',
          status: 'Logged',
          identifiedBy: req.user._id
        }
      ];
      await Deviation.insertMany(demoData);
      list = await Deviation.find().populate('identifiedBy', 'employeeName').sort({ createdAt: -1 });
    }
    
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createDeviation = async (req, res) => {
  try {
    const deviationId = generateId('DEV');
    const deviation = new Deviation({
      ...req.body,
      deviationId,
      identifiedBy: req.user._id
    });
    await deviation.save();

    await AuditLog.create({
      action: 'DEVIATION_LOGGED',
      module: 'QMS_Deviations',
      details: `Deviation ${deviationId} logged: ${deviation.title}`,
      user: req.user.employeeName,
      userId: req.user._id
    });

    res.status(201).json(deviation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateDeviation = async (req, res) => {
  try {
    const deviation = await Deviation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!deviation) {
      return res.status(404).json({ message: 'Deviation not found' });
    }

    await AuditLog.create({
      action: 'DEVIATION_UPDATED',
      module: 'QMS_Deviations',
      details: `Deviation ${deviation.deviationId} updated to ${deviation.status}`,
      user: req.user.employeeName,
      userId: req.user._id
    });

    res.json(deviation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- CAPA Controller ---

exports.getCapas = async (req, res) => {
  try {
    let list = await Capa.find().populate('assignedTo', 'employeeName').sort({ createdAt: -1 });
    
    // Auto-seed if empty
    if (list.length === 0) {
      const demoData = [
        {
          capaId: 'CAPA-4390',
          source: 'Deviation DEV-8821',
          sourceId: 'DEV-8821',
          description: 'A critical deviation occurred where a vaccine fridge temperature rose to 11°C due to seal failure.',
          rootCause: 'Poor Preventive Maintenance on refrigeration seals and lack of automatic alert logging.',
          correctiveAction: 'Replace refrigerator door seal on unit #4. Conduct temperature checks on the vaccine batch.',
          preventiveAction: 'Install automated wireless IoT temperature logging sensors that notify staff via SMS if temperature breaches 7.5°C.',
          assignedTo: req.user._id,
          targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: 'Open'
        },
        {
          capaId: 'CAPA-4301',
          source: 'Audit finding A-3321',
          sourceId: 'A-3321',
          description: 'Infection control audit noted overfilled sharps bins in Ward 3.',
          rootCause: 'Lack of training on sharp handling rules and delayed pickup schedule.',
          correctiveAction: 'Dispose of overfilled bins immediately. Review safety procedures.',
          preventiveAction: 'Reschedule sharps removal twice-daily instead of daily, and run brief training session on sharps safety for all Ward 3 nurses.',
          assignedTo: req.user._id,
          targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'Under Review'
        }
      ];
      await Capa.insertMany(demoData);
      list = await Capa.find().populate('assignedTo', 'employeeName').sort({ createdAt: -1 });
    }
    
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCapa = async (req, res) => {
  try {
    const capaId = generateId('CAPA');
    const capa = new Capa({
      ...req.body,
      capaId
    });
    await capa.save();

    await AuditLog.create({
      action: 'CAPA_LOGGED',
      module: 'QMS_CAPA',
      details: `CAPA ${capaId} logged for source ${capa.source}`,
      user: req.user.employeeName,
      userId: req.user._id
    });

    res.status(201).json(capa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCapa = async (req, res) => {
  try {
    const capa = await Capa.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!capa) {
      return res.status(404).json({ message: 'CAPA not found' });
    }

    await AuditLog.create({
      action: 'CAPA_UPDATED',
      module: 'QMS_CAPA',
      details: `CAPA ${capa.capaId} updated to ${capa.status}`,
      user: req.user.employeeName,
      userId: req.user._id
    });

    res.json(capa);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- Supplier Controller ---

exports.getSuppliers = async (req, res) => {
  try {
    let list = await Supplier.find().sort({ name: 1 });
    
    // Auto-seed if empty
    if (list.length === 0) {
      const demoData = [
        {
          supplierId: 'SUP-401',
          name: 'Global Bio-Med Instruments',
          category: 'Medical Equipment',
          contactPerson: 'Dr. Michael Chen',
          email: 'm.chen@globalbiomed.com',
          phone: '+971 4 200 1100',
          rating: 4.8,
          status: 'Approved',
          lastAuditDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          nextAuditDate: new Date(Date.now() + 270 * 24 * 60 * 60 * 1000)
        },
        {
          supplierId: 'SUP-402',
          name: 'Apex Pharma Solutions',
          category: 'Pharmaceuticals',
          contactPerson: 'Yasmin Al-Mansoori',
          email: 'yasmin@apexpharma.ae',
          phone: '+971 2 444 8899',
          rating: 4.2,
          status: 'Approved',
          lastAuditDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          nextAuditDate: new Date(Date.now() + 330 * 24 * 60 * 60 * 1000)
        },
        {
          supplierId: 'SUP-403',
          name: 'MediCare Diagnostics Ltd',
          category: 'Consumables',
          contactPerson: 'David Miller',
          email: 'd.miller@medicare-diag.com',
          phone: '+44 20 7946 0958',
          rating: 3.5,
          status: 'Under Evaluation',
          lastAuditDate: null,
          nextAuditDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        }
      ];
      await Supplier.insertMany(demoData);
      list = await Supplier.find().sort({ name: 1 });
    }
    
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const supplierId = generateId('SUP');
    const supplier = new Supplier({
      ...req.body,
      supplierId
    });
    await supplier.save();

    await AuditLog.create({
      action: 'SUPPLIER_REGISTERED',
      module: 'QMS_Supplier',
      details: `Supplier ${supplierId} registered: ${supplier.name}`,
      user: req.user.employeeName,
      userId: req.user._id
    });

    res.status(201).json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    await AuditLog.create({
      action: 'SUPPLIER_UPDATED',
      module: 'QMS_Supplier',
      details: `Supplier ${supplier.supplierId} details updated`,
      user: req.user.employeeName,
      userId: req.user._id
    });

    res.json(supplier);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
