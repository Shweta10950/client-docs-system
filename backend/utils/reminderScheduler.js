const Document = require('../models/Document');
const nodemailer = require('nodemailer');

// Setup transporter (uses Gmail here)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,  // your_email@gmail.com
    pass: process.env.EMAIL_PASS   // app password
  }
});

// Send a single reminder email
async function sendReminder(doc) {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: doc.userId.email,  // ✅ corrected from doc.client.email
    subject: `Reminder: ${doc.name} deadline approaching`,
    text: `Your document "${doc.name}" is due on ${new Date(doc.expiry).toDateString()}.` // ✅ corrected from doc.deadline
  });
}

// Scan documents and send reminders for those expiring in next 2 days
async function sendDeadlineReminders() {
  const now = new Date();
  const soon = new Date();
  soon.setDate(now.getDate() + 2);

  // Match based on expiry (not deadline) and populate user info
  const docs = await Document.find({
    expiry: { $gte: now, $lte: soon }
  }).populate('userId');

  for (const d of docs) {
    await sendReminder(d);
  }

  console.log('Reminders sent for', docs.length, 'documents');
}

module.exports = { sendReminder, sendDeadlineReminders };
