
/* 
电影分类分组
*/
module.exports = app => {
  const mongoose = app.mongoose;
  const { Schema } = mongoose;
  const GroupSchema = new mongoose.Schema({
    /**
     * Type
     * 1.热门
     * 2.最新
     * 3.电视剧
     * 4.动漫
     * 5.专题
     */
    Type:Number,
    Name:String,
    Describe:String,
    Group:[{ type:Number, ref: "t_movie_home" }],
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

  GroupSchema.pre("save", function (next) {
    if (this.isNew) {
      this.meta.createAt = this.meta.updateAt = Date.now();
    } else {
      this.meta.updateAt = Date.now();
    }
    next();
  });

  GroupSchema.statics = {
    async saveOne(_group) {
      let group = await this.findOne({ type: _group.type }).exec();
      if (group) {
        
      } else {
        group = new Page(_group);
      };

      try {
        const isSave = await group.save();
        return page;
      } catch (error) {
        console.log(error);
      }
    }
  }
  const Group = mongoose.model('t_movie_group', GroupSchema);
  return Group;
}

