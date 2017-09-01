const mongoose = require('mongoose');
const MovieSchema = require('../../schemas/movie/movies');

const Movie = mongoose.model("Movie", MovieSchema)

module.exports = Movie;