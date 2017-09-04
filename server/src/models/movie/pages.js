const mongoose = require('mongoose');
const PagesSchema = require('../../schemas/movie/pages');

const Pages = mongoose.model("Movie_newests", PagesSchema)

module.exports = Pages;