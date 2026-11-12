const mongoose = require('mongoose');
module.exports = mongoose.model('DocumentFile', new mongoose.Schema({
  name: String, mime: String, data: { type: Buffer, select: false }
}, { timestamps: true }));
