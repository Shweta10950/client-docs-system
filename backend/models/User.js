const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  name:String, email:String, password:String, role:{type:String, enum:['client','admin'], default:'client'}
});
module.exports = mongoose.model('User', userSchema);