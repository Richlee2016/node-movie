const mongoose = require('mongoose');
const NewestSchema = require('../../schemas/movie/newest');

const Newest = mongoose.model("Movie_newests", NewestSchema)

module.exports = Newest;