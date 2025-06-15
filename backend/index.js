require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const cron = require("node-cron");
const fs = require("fs");
const path = require("path");

const auth = require("./middleware/auth");
const Document = require("./models/Document");
const { sendDeadlineReminders, sendReminder } = require("./utils/reminderScheduler");
const authRoutes = require("./routes/auth");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "../frontend")));

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/whitecircle");

// Serve Frontend Login Page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend", "login.html"));
});

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Routes
app.use("/api", authRoutes);

// Upload Document
app.post("/api/upload-document", auth, upload.single("file"), async (req, res) => {
  const { name, type, description, expiry } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "File is missing" });
  }

  const doc = new Document({
    name,
    type,
    description,
    expiry,
    fileUrl: `/uploads/${req.file.filename}`,
    userId: req.user.id,
    clientName: req.user.email,
  });

  await doc.save();
  res.json({ message: "Document uploaded successfully" });
});

// Get Documents (Client)
app.get("/api/documents", auth, async (req, res) => {
  const docs = await Document.find({ userId: req.user.id });
  res.json(docs);
});

// Get All Documents (Admin)
app.get("/api/admin/documents", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });

  const query = {};
  if (req.query.client) query.clientName = { $regex: req.query.client, $options: "i" };
  if (req.query.type) query.type = { $regex: req.query.type, $options: "i" };
  if (req.query.expiry) query.expiry = { $lte: new Date(req.query.expiry) };

  try {
    const docs = await Document.find(query).populate("userId", "email");
    const formatted = docs.map(doc => ({
      _id: doc._id,
      name: doc.name,
      type: doc.type,
      description: doc.description,
      expiry: doc.expiry,
      fileUrl: doc.fileUrl,
      clientEmail: doc.userId?.email || "Unknown"
    }));
    res.json(formatted);
  } catch (err) {
    console.error("Error fetching documents:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete Document + File
app.delete("/api/documents/:id", auth, async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Document not found" });

  const filePath = path.join(__dirname, doc.fileUrl);
  fs.unlink(filePath, (err) => {
    if (err) console.error("Error deleting file:", err);
  });

  await doc.deleteOne();
  res.json({ message: "Document and file deleted" });
});

// ✅ Edit Document + Optional File Replacement
app.put("/api/documents/:id", auth, upload.single("file"), async (req, res) => {
  const { name, type, description, expiry } = req.body;

  const updateFields = { name, type, description, expiry };

  if (req.file) {
    const doc = await Document.findById(req.params.id);
    if (doc && doc.fileUrl) {
      const oldPath = path.join(__dirname, doc.fileUrl);
      fs.unlink(oldPath, err => {
        if (err) console.error("Old file delete error:", err);
      });
    }
    updateFields.fileUrl = `/uploads/${req.file.filename}`;
  }

  const updated = await Document.findOneAndUpdate(
    { _id: req.params.id, userId: req.user.id },
    updateFields,
    { new: true }
  );

  if (!updated) return res.status(404).json({ message: "Document not found or unauthorized" });
  res.json(updated);
});



// Manual Reminder
app.post("/api/send-reminder", auth, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  try {
    const doc = await Document.findById(req.body.documentId).populate("userId");
    if (!doc) return res.status(404).json({ message: "Document not found" });
    await sendReminder(doc);
    res.json({ message: "Reminder sent" });
  } catch (err) {
    console.error("Reminder error:", err);
    res.status(500).json({ message: "Failed to send reminder" });
  }
});

// Auto Reminder Daily at 9AM
cron.schedule("0 9 * * *", sendDeadlineReminders);

// Start Server
app.listen(5000, () => {
  console.log("✅ Server running at http://localhost:5000");
});

