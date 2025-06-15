const router = require('express').Router();
const multer = require('multer');
const Document = require('../models/Document');
const jwt = require('jsonwebtoken');

const upload = multer({ dest: 'uploads/' });

const auth = (req,res,next)=>{
  const token = req.headers.authorization?.split(' ')[1];
  try {
    req.user = jwt.verify(token,process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({msg:'Unauthorized'});
  }
};

// Upload
router.post('/', auth, upload.single('file'), async (req,res)=>{
  const {name,type,description,deadline} = req.body;
  const doc = new Document({
    client: req.user.uid,
    name, type, description,
    deadline:new Date(deadline),
    filePath: req.file.filename
  });
  await doc.save();
  res.json(doc);
});

// List own docs
router.get('/', auth, async (req,res)=>{
  const docs = await Document.find({ client: req.user.uid });
  res.json(docs);
});

// Edit
router.put('/:id', auth, async (req,res)=>{
  const { name, type, description, deadline } = req.body;
  const doc = await Document.findOneAndUpdate(
    { _id:req.params.id, client:req.user.uid },
    { name, type, description, deadline:new Date(deadline) },
    { new:true }
  );
  res.json(doc);
});

// Delete
router.delete('/:id', auth, async (req,res)=>{
  await Document.findOneAndDelete({ _id:req.params.id, client:req.user.uid });
  res.json({ msg:'Deleted' });
});

module.exports = router;
