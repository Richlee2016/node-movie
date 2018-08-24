"use strict";

const Controller = require("egg").Controller;
const unset = require("lodash/unset");
class MovieController extends Controller {
  constructor(app) {
    super(app);
    // 分组 参数验证
    this.GroupValidate = {
      Type: { type: "int" },
      Name: { type: "string" },
      Describe: { type: "string" },
      Group: { type: "array" }
    };
  }


  async getMovieList(ctx) {
    let { page, size, year } = ctx.query;
    page = page ? Number(page) : 1;
    size = size ? Number(size) : 10;
    let q = year ? { page, size, year: Number(year) } : { page, size };
    let query = Object.assign(ctx.query, q);
    const res = await ctx.service.movies.fetchList(query);
    ctx.body = {
      movies: res
    };
    ctx.status = 200;
  }

  async getMovieVod(ctx) {
    const { id } = ctx.params;
    ctx.validate({ id: "int" }, { id: Number(id) });
    const res = await ctx.service.movies.fetchVod(id);
    ctx.body = {
      movie: res
    };
    ctx.status = 200;
  }

  async getGroup(ctx){
    let {types,page,size} = ctx.query;
    types = types?types.split(",") : "";
    page = page?Number(page) : 1;
    size = size?Number(size) : 10;
    const res = await ctx.service.movies.getGroup({types,page,size});
    if(res.length){
      ctx.body = res;
      ctx.status = 200;
    }else{
      ctx.body = "没有分组信息";
      ctx.status = 200;
    };
  }

  async createGroup(ctx){
    const group = ctx.request.body;
    ctx.validate(this.GroupValidate);
    const res = await ctx.service.movies.createGroup(group);
    if(typeof res == 'object'){
      ctx.body = res;
      ctx.status = 201;
    }else if(typeof res == 'string'){
      ctx.body = res;
      ctx.status = 202;
    }
  }

  async updateGroup(ctx){
    const group = ctx.request.body;
    ctx.validate(this.GroupValidate);
    const res = await ctx.service.movies.updateGroup(group);
    ctx.body = "修改成功";
    ctx.status = 201;
  }

  async single_MovieBili(ctx) {
    const {
      params: { id }
    } = ctx;
    const res = await ctx.service.movies.fetchBili(id);
    ctx.body = {
      page: res
    };
    ctx.status = 200;
  }
  async get_MovieCollect() {
    console.log(0);
    const ctx = this.ctx;
    const openid = ctx.session.user;
    const res = await ctx.service.users.fetchCollect(
      "E71A6C17E7FAE3981C4F63CBE98A5F43",
      "movieCollect.id",
      "id name area year img"
    );
    ctx.body = res;
    ctx.status = 200;
  }
  async post_MovieCollect() {
    const ctx = this.ctx;
    const openid = ctx.session.user;
    const { id, handle } = ctx.request.body;
    const res = await ctx.service.users.createCollect(
      "E71A6C17E7FAE3981C4F63CBE98A5F43",
      id,
      handle,
      "movieCollect"
    );
    ctx.body = res;
    ctx.status = 201;
  }
  // /**
  //  * @OnlineMovie {熊猫在线电影}
  //  * get => /OnlineMovie {全部}
  //  * get => /OnlineMovie/:id {单个}
  //  */
  // async get_OnlineMovies() {
  //   const ctx = this.ctx;
  //   const { query: p } = ctx;
  //   const res = await ctx.service.movies.fetchOnlineList(p);
  //   ctx.body = {
  //     movies: res
  //   };
  //   ctx.status = 200;
  // }
  // async single_OnlineMovies() {
  //   const ctx = this.ctx;
  //   const { params: { id } } = ctx;
  //   console.log(id);
  //   ctx.validate({ id: "int" }, { id: Number(id) });
  //   const res = await ctx.service.movies.fetchOnlineMovie(id);
  //   ctx.body = {
  //     movie: res
  //   };
  //   ctx.status = 200;
  // }
  // async get_OnlinePageMenu(ctx){
  //   const menu = await ctx.service.movies.fetchOlinePageMenu();
  // }
  // /*
  // @HotMovies {热门推荐}
  // get /HotMovies {全部}
  // get /HotMovies/:id {单个}
  // post /UpdateHotMovie {增加和修改}
  // post /DeleteHotMovie {删除}
  // */
  // async get_HotMovies() {
  //   const ctx = this.ctx;
  //   const { page, size } = ctx.query;
  //   const res = await ctx.service.movies.fetchHotList({
  //     page: Number(page) || 1,
  //     size: Number(size) || 10
  //   });
  //   ctx.body = {
  //     movies: res
  //   };
  //   ctx.status = 200;
  // }
  // async single_HotMovies() {
  //   const ctx = this.ctx;
  //   const { params: { id } } = ctx;
  //   ctx.validate({ id: "int" }, { id: Number(id) });
  //   const res = await ctx.service.movies.fetchHotMovie(id);
  //   ctx.body = {
  //     movie: res
  //   };
  //   ctx.status = 200;
  // }
  // async post_UpdateHotMovie() {
  //   const ctx = this.ctx;
  //   // ctx.validate(this.Rules);
  //   let body = ctx.request.body;
  //   const {movieHome,hotType} = ctx.request.body;
  //   const sendBody = Object.assign(body,{movieHome:Number(movieHome) || 0 ,hotType:Number(hotType) || 0});
  //   const res = await ctx.service.movies.csHotMovie(sendBody);
  //   ctx.body = res;
  //   ctx.status = 201;
  // }
  // async post_DeleteHotMovie() {
  //   const ctx = this.ctx;
  //   const { id } = ctx.request.body;
  //   const res = await ctx.service.movies.destroyHotMovie(id);
  //   ctx.body = res;
  //   ctx.status = 204;
  // }
}

module.exports = MovieController;
