

module.exports = app => {
  const mongoose = app.mongoose;
  const { Schema } = mongoose;
  const Mixed = Schema.Types.Mixed
  const MoviePageSchema = new mongoose.Schema({
    name: String,
    /**
     * 10 电影家园首页
     * 20 熊猫-筛选
     * 21 熊猫-首页
     * 22 熊猫-电影
     * 23 熊猫-连续剧
     * 24 熊猫-综艺
     * 25 熊猫-动漫
     * 26 熊猫-专题
     * 27 熊猫-影片排行
     * 28 熊猫-最近更新
     */
    type:Number,
    list: Mixed,
    meta: {
      createAt: {
        type: Date,
        default: Date.now()
      },
      updateAt: {
        type: Date,
        default: Date.now()
      }
    }
  });

  MoviePageSchema.pre("save", function (next) {
    if (this.isNew) {
      this.meta.createAt = this.meta.updateAt = Date.now();
    } else {
      this.meta.updateAt = Date.now();
    }
    next();
  });

  MoviePageSchema.statics = {
    async savePage(data) {
      let page = await this.findOne({ name: data.name }).exec();
      const _page = data;
      if (page) {
        // 列表第一个改变之后  更换
        if(data.list.group[0] !== page.list.group[0]){
          console.log(5);
          page = Object.assign(page,_page);
        };
      } else {
        page = new Page(_page);
      };

      try {
        const isSave = await page.save();
        return page;
      } catch (error) {
        console.log(error);
      }
    }
  }
  const Page = mongoose.model('t_movie_page', MoviePageSchema);
  return Page;
}

