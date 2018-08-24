"use strict";

const Controller = require("egg").Controller;
class MoviesController extends Controller {
  constructor(app) {
    super(app);
  }
  
  async search(ctx){
    const {wd} = ctx.query;
    const res = await ctx.service.crawler.proxyOnlineSearch(wd); 
    ctx.body = res;
    // ctx.body = [{"img":"http://tu.freesaas.net/upload/vod/2016-10-16/14766106082.jpg","title":"&#x8D85;&#x840C;&#x82F1;&#x96C4;","actors":["欧弟","杨舒婷","成泰燊","田源  "],"directors":["欧阳奋强  "],"area":"大陆","year":"2014","href":"http://www.dy280.com/detail/22285.html"},{"img":"http://tu.freesaas.net/upload/vod/2017-12-31/15146583131.jpg","title":"&#x6211;&#x53EB;&#x53F6;&#x51C9;&#x6668;","actors":["黄振东","李嘉鼎","王叠","王曼妮  "],"directors":["陈韦达"],"area":"大陆","year":"2015","href":"http://www.dy280.com/detail/118948.html"}];
  }

}

module.exports = MoviesController;
