const Document = require('../models/Document');
const multer = require('multer');

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

exports.upload = multer({ storage }).single('file');

// Upload document handler
exports.uploadDocument = async (req, res) => {
  try {
    const { name, type, description, expiryDate } = req.body;

    const document = new Document({
      clientId: req.userId,
      name,
      type,
      description,
      expiryDate,
      filePath: req.file.path
    });

    await document.save();
    res.json({ message: 'Document uploaded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

// List all documents of a user
exports.listDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ clientId: req.userId });
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch documents', error: err.message });
  }
};
