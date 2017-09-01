const mongoose = require('mongoose');
const userSchema = require('../schemas/users');

const Users = mongoose.model('Users', userSchema);

module.exports = Users;