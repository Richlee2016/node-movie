module.exports = app => {
  const config = app.config.richCof.qiniu;
  const mongoose = app.mongoose;
  const { Schema } = mongoose;
  const Mixed = Schema.Types.Mixed;
  const HotSchema = new mongoose.Schema({
    id: Number,
    name: String,
    movieHome: { type:Number, ref: "t_movie_home" },
    // onlineSrc:String,
    // bgm: String,
    video: String,
    videoKey:String,
    cover:String,
    coverKey:String,
    hotType: Number,//1 热门推荐  2 即将上映 3.经典影片,
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

  HotSchema.pre("save", function(next) {
    if (this.isNew) {
      this.meta.createAt = this.meta.updateAt = Date.now();
    } else {
      this.meta.updateAt = Date.now();
    }
    next();
  });

  HotSchema.statics = {
    async SaveHot(data) {
      let hot = await this.findOne({ id:data.id }).exec();
      let count = await this.count();
      const _hot = Object.assign({},data,{
        id:count+1
      });
      if (hot) {
        hot = Object.assign(hot,_hot);
      } else {
        hot = new Hot(_hot);
      }
      try {
        const res = await hot.save();
        console.log(`${data.name}更新成功`);
        return res;
      } catch (error) {
        console.log(`${data.name}更新失败`);
        console.log(error);
      }
    }
  };

  const Hot = mongoose.model("t_movie_hot", HotSchema);
  return Hot;
};
