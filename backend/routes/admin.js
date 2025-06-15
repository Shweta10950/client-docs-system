const router = require('express').Router();
const Document = require('../models/Document');
const jwt = require('jsonwebtoken');
const { sendReminder } = require('../utils/reminder');

const authAdmin = (req,res,next)=>{
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const u = jwt.verify(token,process.env.JWT_SECRET);
    if(u.role !== 'admin') return res.status(403).json({msg:'Forbidden'});
    req.user = u; next();
  } catch { res.status(401).json({msg:'Unauthorized'}); }
};

// List all with optional filters
router.get('/documents', authAdmin, async(req,res)=>{
  const {clientName,type,before} = req.query;
  let q = {};
  if(type) q.type = type;
  if(before) q.deadline = { $lte:new Date(before) };
  let docs = await Document.find(q).populate('client','name email');
  if(clientName) docs = docs.filter(d=>d.client.name.toLowerCase().includes(clientName.toLowerCase()));
  res.json(docs);
});

// Manual reminder
router.post('/send-reminder/:docId', authAdmin, async(req,res)=>{
  const doc = await Document.findById(req.params.docId).populate('client');
  if(!doc) return res.status(404).json({msg:'Not found'});
  await sendReminder(doc);
  res.json({msg:'Reminder sent'});
});

module.exports = router;
