const Service = require("egg").Service;
class MoviesService extends Service {
  constructor(ctx) {
    super(ctx);
    this.User = this.ctx.model.User;
    this.Movie = this.ctx.model.Movie;
    this.Page = this.ctx.model.Page;
    this.Online = this.ctx.model.Online;
    this.Hot = this.ctx.model.Hot;
    this.Group = this.ctx.model.Group;
  }
  /**
   * params {String} w 搜索关键词
   * return {Object} 搜索返回值
   */
  async search({ w, p, s }) {
    console.log(w, p, s);
    let page = isNaN(Number(p)) ? 1 : Number(p);
    let size = isNaN(Number(s)) ? 24 : Number(s);

    var reg = new RegExp(w);

    let query = {
      $or: [{ name: { $regex: reg } }]
    };

    if (!w) return await this.fetchList({ page, size });

    if (w >= 2) {
      query["$or"].concat([
        { actor: { $regex: reg } },
        { director: { $regex: reg } }
      ]);
    }

    let skip = (page - 1) * size;
    try {
      const counts = await this.Movie.countDocuments(query).exec();
      const list = await this.Movie.find(query)
        .limit()
        .sort({ _id: -1 })
        .limit(size)
        .skip(skip)
        .exec();
      return {
        counts,
        list
      };
    } catch (error) {
      console.log(error);
    }
  }
  /*
   * 根据url参数 筛选电影
   * @param {Object} q:{page,size,year,director,actor,classify,catalog} 筛选参数
   * @return {Object} 筛选结果
   */
  async fetchList(q) {
    let { page, size } = q;
    page = isNaN(Number(page)) ? 1 : Number(page);
    size = isNaN(Number(size)) ? 10 : Number(size);

    let query = [{ id: { $exists: true } }];

    for (let [key, val] of Object.entries(q)) {
      let data = {};
      if (["page", "size"].indexOf(key) === -1) {
        data[key] = val;
        query.push(data);
      }
    }

    let skip = (page - 1) * size;

    let search = {
      name: { $ne: "none" },
      $and: query
    };
    try {
      const counts = await this.Movie.countDocuments(search).exec();
      const movielist = await this.Movie.find(search, {
        name: 1,
        year: 1,
        img: 1
      })
        .sort({ _id: -1 })
        .limit(size)
        .skip(skip)
        .exec();

      return {
        list: movielist,
        count: counts
      };
    } catch (error) {
      console.log(error);
    }
  }

  /*
   * 根据id 获取单个电影
   * @param {Number} 电影id
   * @return {Object} 查询的电影
   */
  async fetchVod(id) {
    const ctx = this.ctx;
    try {
      let movie = await this.Movie.findOne({ id }).exec();
      if (!movie) ctx.redirect("/nosorce");
      return movie;
    } catch (e) {
      console.error(e);
    }
  }

  /*
   * 获取首页数据
   * @return {Object} 首页数据
   */
  async fetchIndex() {
    const ctx = this.ctx;
    try {
      let page = await this.Page.findOne({ name: "index" }).exec();
      if (!page) ctx.redirect("/nosorce");
      return page;
    } catch (e) {
      console.error(e);
    }
  }
  /*
   * 获取分组数据
   * @param {Number} Type 编号
   * @return {Object} 分组电影数据
   */
  async getGroup({ types, page = 1, size = 10 }) {
    let query = {};
    let skip = (page - 1) * size;
    if (!types) {
      query = {};
    } else {
      query = { Type: { $in: types } };
    }
    try {
      const res = await this.Group.find(query)
        .populate("Group", { name: 1, area: 1, year: 1, img: 1 })
        .limit(size)
        .skip(skip)
        .exec();
      return res;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * 创建电影分组
   * @param {Number} Type 编号
   * @param {String} Describe 描述
   * @param {String} Name 名称
   * @param {Array} Group 电影组
   * @return {Object} 储存的分组
   */
  async createGroup(_group) {
    try {
      const typeExist = await this.Group.findOne({ Type: _group.Type }).exec();
      if (!typeExist) {
        const group = new this.Group(_group);
        let isSave = group.save();
        return isSave;
      } else {
        return "编号已经存在";
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   修改电影分组
   *@param {Number} 
   * @param {String} Describe 描述
   * @param {String} Name 名称
   * @param {Array} Group 电影组
   * @return {Object} 修改的分组
   */
  async updateGroup(_group) {
    let update = {};
    for (const [key, value] of Object.entries(_group)) {
      if (key !== "Type") {
        update[key] = value;
      }
    }
    const isUpdate = await this.Group.updateOne(
      { Type: _group.Type },
      { $set: update }
    );
    return isUpdate;
  }
}

module.exports = MoviesService;
