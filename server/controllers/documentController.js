const Document = require('../models/Document');
const Notification = require('../models/Notification');

exports.getDocuments = async (req, res) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 });
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
};

exports.addDocument = async (req, res) => {
  try {
    const { name, type, department, ref, revisedDate, classification } = req.body;
    
    const revised = new Date(revisedDate);
    // 3 month gap for next revision date
    const nextRevDate = new Date(revised);
    nextRevDate.setMonth(nextRevDate.getMonth() + 3);

    const count = await Document.countDocuments();
    const documentId = `CMCDOC-${(count + 1).toString().padStart(4, '0')}`;

    const newDoc = new Document({
      documentId,
      name,
      type,
      department,
      ref,
      revisedDate: revised,
      nextRevDate,
      classification: classification || 'Restricted',
      status: 'Active',
      version: '01',
      uploadDate: new Date(),
      fileUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      uploadedBy: req.user._id
    });

    const savedDoc = await newDoc.save();

    // Create Persistent Notification for Admins
    await Notification.create({
      type: "document_upload",
      message: `New document uploaded: ${name}`,
      user: req.user.employeeName,
      userId: req.user._id,
      actionLink: "/documents",
      recipientRole: "admin"
    });

    // Create Persistent Notification for the Uploader
    await Notification.create({
      type: "document_upload",
      message: `You uploaded a new document: ${name}`,
      user: req.user.employeeName,
      userId: req.user._id,
      actionLink: "/dashboard/documents",
      recipientRole: "user",
      recipientId: req.user._id
    });

    // Emit Socket Notification to Admins
    if (req.io) {
      req.io.to("admins").emit("new-notification", {
        type: "document_upload",
        message: `New document uploaded: ${name}`,
        user: req.user.employeeName,
        time: new Date()
      });
    }

    res.status(201).json(savedDoc);
  } catch (error) {
    res.status(500).json({ message: 'Error creating document', error: error.message });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const { name, type, department, ref, revisedDate, classification } = req.body;
    
    let updateData = { name, type, department, ref, classification };
    
    if (revisedDate) {
      const revised = new Date(revisedDate);
      const nextRevDate = new Date(revised);
      nextRevDate.setMonth(nextRevDate.getMonth() + 3);
      updateData.revisedDate = revised;
      updateData.nextRevDate = nextRevDate;
    }

    if (req.file) {
      updateData.fileUrl = `/uploads/${req.file.filename}`;
    }

    const updatedDoc = await Document.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.status(200).json(updatedDoc);
  } catch (error) {
    res.status(500).json({ message: 'Error updating document', error: error.message });
  }
};

exports.endorseDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    
    const userId = req.user._id;
    const isEndorsed = document.endorsedBy && document.endorsedBy.some(id => id.toString() === userId.toString());
    
    let updatedDoc;
    if (isEndorsed) {
      // Remove endorsement
      updatedDoc = await Document.findByIdAndUpdate(
        req.params.id,
        { $pull: { endorsedBy: userId } },
        { new: true }
      );
    } else {
      // Add endorsement
      updatedDoc = await Document.findByIdAndUpdate(
        req.params.id,
        { $addToSet: { endorsedBy: userId } },
        { new: true }
      );
      
      // Create Persistent Notification for Admins
      await Notification.create({
        type: "document_like",
        message: `${req.user.employeeName} liked document: ${document.name}`,
        user: req.user.employeeName,
        userId: req.user._id,
        actionLink: "/documents",
        recipientRole: "admin"
      });

      // Create Persistent Notification for the User (Self-Activity)
      await Notification.create({
        type: "document_like",
        message: `You liked document: ${document.name}`,
        user: req.user.employeeName,
        userId: req.user._id,
        actionLink: "/dashboard/documents",
        recipientRole: "user",
        recipientId: req.user._id
      });

      // Emit Socket Notification to Admins
      if (req.io) {
        req.io.to("admins").emit("new-notification", {
          type: "document_like",
          message: `${req.user.employeeName} liked document: ${document.name}`,
          user: req.user.employeeName,
          time: new Date()
        });
      }
    }
    
    res.status(200).json(updatedDoc);
  } catch (error) {
    console.error('Endorsement Error:', error);
    res.status(500).json({ message: 'Error endorsing document', error: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    await Document.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
};
