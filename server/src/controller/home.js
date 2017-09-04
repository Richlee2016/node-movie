const request = require("request-promise");
const Movie = require("../models/movie/movies");
const Page = require("../models/movie/pages");
// 首页
exports.page =async function(req, res, next) {
    const pageData = Page.findOne({});
    console.log(pageData);
    res.json({msg:'ok'});
    // res.render("home",{title:'熊猫电影之家',data:{a:1}});
};
