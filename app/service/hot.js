const Service = require("egg").Service;
class HotService extends Service {
  constructor(ctx) {
    super(ctx);
    this.User = this.ctx.model.User.User;
    this.Movie = this.ctx.model.Movie.Movie;
    this.Page = this.ctx.model.Movie.Page;
    this.Online = this.ctx.model.Movie.OnlineMovie;
    this.Hot = this.ctx.model.Movie.Hot;
    this.Crawler = this.ctx.helper.crawler.Movie;
  }

  // 所有得推荐电影资源
  async fetchHotList(page, size) {
    let skip = (page - 1) * size;
    const counts = await this.Hot.count({}).exec();
    const res = await this.Hot.find()
      .limit(size)
      .skip(skip)
      .populate("movieHome")
      .exec();
    return {
      list:res,
      counts
    };
  }
  // 单个推荐电影资源
  async fetchHotMovie(id) {
    const res = await this.Hot.findOne({ id })
      .populate("movieHome")
      .exec();
    return res;
  }
  // 增加或修改单个推荐电影资源
  async csHotMovie(hot) {
    // const newhot =await this.ctx.service.qiniu.hotQiniuUpdate(hot)
    const res = await this.Hot.SaveHot(newhot);
    return res;
  }
  // 删除单个推荐电影资源
  async destroyHotMovie(id) {
    const res = await this.Hot.remove({ id: { $in: id } }).exec();
    return res;
  }
}

module.exports = HotService;
