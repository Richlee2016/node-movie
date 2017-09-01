const request = require("request-promise");
// 首页
exports.page =async function(req, res, next) {
    res.render("home",{title:'熊猫电影之家'});
};
