"use strict";

const Controller = require("egg").Controller;

class HomeController extends Controller {
  constructor(ctx) {
    super(ctx);
  }
  // 首页
  async index(ctx) {
    // await ctx.render("index.html", {});
    ctx.redirect("/home");
  }
  // 电影首页
  async home(ctx) {
    const user = ctx.session.user || {};
    if(Object.keys(user).length){
      const info = {
        name:user.qqInfo.nickname,
        cover:user.qqInfo.figureurl_qq_2
      }
      ctx.cookies.set("userInfo",encodeURIComponent(JSON.stringify(info)));
    };
    const res = await ctx.service.movies.getGroup({types:[1,2,3,4]});
    await ctx.render("home.html", {hot:res[0],newest:res[1],tv:res[2],cartoon:res[3]});
  }

  // 详情页
  async vod(ctx){
    const {id} = ctx.params;
    console.log(id);
    const res = await ctx.service.movies.fetchVod(id);
    await this.ctx.render('vod.html',{data:res})
  }

  // 列表
  async list(ctx){
    let querys = ctx.query;
    querys.size = 24;
    querys.page = querys.page?Number(querys.page) : 1;
    const res = await ctx.service.movies.fetchList(querys);
    await this.ctx.render('list.html',{list:res.list})
  }  
  
  // 分组
  async group(ctx){
    let {type} = ctx.params;
    let start=100,end=109;
    if(type == 'movie'){
      start = 101;
      end = 109;
    }
    let types = [];
    for (let i = start; i < end; i++) {
      types.push(i);
    }
    const res = await ctx.service.movies.getGroup({types});
    const list = res.reduce((arr,box) => {
      arr.push(box.Group)
      return arr;
    },[])
    await this.ctx.render('group.html',{list})
  }

  //搜索
  async search(ctx){
    const res = await this.service.movies.search(ctx.query);
    await this.ctx.render('list.html',{list:res.list,counts:res.counts})
  }

  /**error */
  // 暂无资源页
  async noSorce(ctx){
    await ctx.render("error/nosorce.html",{});
  }
}

module.exports = HomeController;
