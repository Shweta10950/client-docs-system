const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register (clients only)
router.post('/register', async (req, res)=>{
  const {name,email,password} = req.body;
  const exists = await User.findOne({email});
  if(exists) return res.status(400).json({msg:'Email in use'});
  const hash = await bcrypt.hash(password,10);
  const user = new User({name,email,password:hash});
  await user.save();
  res.json({msg:'Registered'});
});

// Login (client/admin)
router.post('/login', async (req, res) => {
  console.log("Login request received:", req.body);
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ email, role }); // also check role

    if (!user) {
      return res.status(400).json({ message: "Invalid email or role" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2d" }
    );

    res.json({ token, role: user.role });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
