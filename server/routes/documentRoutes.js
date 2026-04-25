const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { getDocuments, addDocument, deleteDocument, updateDocument, endorseDocument } = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage: storage });

router.route('/')
  .get(protect, getDocuments)
  .post(protect, upload.single('file'), addDocument);

router.route('/:id')
  .put(protect, upload.single('file'), updateDocument)
  .delete(protect, deleteDocument);

router.route('/:id/endorse')
  .put(protect, endorseDocument);

module.exports = router;
