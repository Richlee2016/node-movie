"use strict";

const movieCof = require("./config.movie.js");
module.exports = appInfo => {
  const config = (exports = {});

  //项目的设置
  config.richCof = movieCof;

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + "_1531722867582_7240";

  // 中间件
  config.middleware = ["errorHandler"];

  //mongodb
  config.mongoose = {
    url: "mongodb://localhost:27017/eggapi",
    options: {}
  };

  //安全设置
  config.security = {
    csrf: {
      enable: false,
      ignoreJSON: false
    },
    domainWhiteList: ["http://localhost:8087"]
  };

  //跨域设置
  config.cors = {
    allowMethods: "GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS"
  };

  // 模板引擎
  config.view = {
    defaultViewEngine: "nunjucks",
    mapping: {
      ".html": "nunjucks"
    }
  };

  return config;
};
