"use strict";

const Controller = require("egg").Controller;
class HotController extends Controller {
  constructor(app) {
    super(app);
    this.HotRules = {//热门推荐字段
      id: "int",
      name: "string",
      movieHome: "int",
      onlineMovie: "int",
      bgm: "string",
      videoUrl: "string",
      introduce: "string"
    };
  }
  /*
   * 返回热点列表
   * @query {Number} page 页数
   * @query {Number} size 个数
   */
  async get_HotMovies() {
    const ctx = this.ctx;
    const { page, size } = ctx.query;
    const res = await ctx.service.hot.fetchHotList({
      page: Number(page) || 1,
      size: Number(size) || 10
    });
    ctx.body = {
      data: res
    };
    ctx.status = 200;
  }
  /*
   * 返回单个热点
   * @param {Number} id 电影id
   */
  async single_HotMovies() {
    const ctx = this.ctx;
    const { params: { id } } = ctx;
    ctx.validate({ id: "int" }, { id: Number(id) });
    const res = await ctx.service.hot.fetchHotMovie(id);
    ctx.body = {
      movie: res
    };
    ctx.status = 200;
  }
  /*
   * 更新单个热点
   * @body {String} name 电影名称
   * @body {Number} movieHome 电影家园关联id
   * @body {Number} hotType 热点类型
   * @body {String} video 电影视频
   * @body {String} cover 电影封面
   */
  async post_UpdateHotMovie() {
    const ctx = this.ctx;
    // ctx.validate(this.Rules);
    let body = ctx.request.body;
    const {movieHome,hotType} = ctx.request.body;
    const sendBody = Object.assign(body,{movieHome:Number(movieHome) || 0 ,hotType:Number(hotType) || 0});
    const res = await ctx.service.hot.csHotMovie(sendBody);
    ctx.body = res;
    ctx.status = 201;
  }

  /*
   * 删除单个热点
   * @body {Number} id 电影id
   */
  async post_DeleteHotMovie() {
    const ctx = this.ctx;
    const { id } = ctx.request.body;
    const res = await ctx.service.hot.destroyHotMovie(id);
    ctx.body = res;
    ctx.status = 204;
  }
}

module.exports = HotController;
