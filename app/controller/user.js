"use strict";

const Controller = require("egg").Controller;
const qs = require("querystring");
class UserController extends Controller {
  constructor(ctx) {
    super(ctx);
    this.Movie = this.ctx.model.Movie;
    this.Page = this.ctx.model.Page;
  }

  async index(ctx) {
    const { code, state } = ctx.query;
    const res = await ctx.service.user.oauthHandle(code, state);
    ctx.redirect("/home");
  }

  async crawlerMovieIndex(ctx) {
    const group = await ctx.service.crawler.updateMovieIndex();
    const data = await this.Movie.find({ id: { $in: group } }).exec();
    const savePage = await this.Page.savePage({
      name: "index",
      type: 10,
      list: {
        data,
        group
      }
    });
    ctx.body = savePage;
  }
}

module.exports = UserController;
