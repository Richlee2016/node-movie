const Service = require("egg").Service;
class MoviesService extends Service {
  constructor(ctx) {
    super(ctx);
    this.Online = this.ctx.model.Movie.Online;
    const prefix = "http://www.dy280.com";
  }

  async porxySearch(wd){
    const ctx = this.ctx;
    const res = await ctx.service.onlines.proxyOnlineSearch(wd)
    return res;
  }

}

module.exports = MoviesService;