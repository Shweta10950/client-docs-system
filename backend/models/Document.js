const mongoose = require('mongoose');
const docSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // ✅ unified
  name: String,
  type: String,
  description: String,
  expiry: Date,  // ✅ match your backend naming
  fileUrl: String,  // ✅ consistent with upload route
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', docSchema);