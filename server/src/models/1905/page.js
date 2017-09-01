const mongoose = require('mongoose');
const PageSchema = require('../../schemas/1905/page');

const Page = mongoose.model("t_1905_page", PageSchema)

module.exports = Page;