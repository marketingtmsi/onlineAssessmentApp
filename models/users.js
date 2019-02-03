var mongoose = require('mongoose');
var userSchema = mongoose.Schema({
    username: String,
    role: String
  });
  module.exports = mongoose.model('users', userSchema );