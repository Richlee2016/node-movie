module.exports = app => {
  const mongoose = app.mongoose;
  const OnlineSchema = new mongoose.Schema({
    _id:Number,
    id: Number,
    img: String,
    name: String,
    update: String,
    director:[],
    actor: [],
    area: String,
    type: {},
    language: String,
    year: String,
    intro: String,
    play: [],
    downUrl: [],
    introduce: String,
    same: [],
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

  OnlineSchema.pre("save", function (next) {
    if (this.isNew) {
      this.meta.createAt = this.meta.updateAt = Date.now();
    } else {
      this.meta.updateAt = Date.now();
    }
    next();
  });

  OnlineSchema.statics = {
    async saveOnline(data) {
      let online = await this.findOne({ _id: data.id }).exec();
      const _online = Object.assign(data,{_id:data.id});
      if (online) {
        online = Object.assign(online,_online);
      } else {
        online = new Online(_online);
      };
      try {
        await online.save();
        console.log(`${online.name}更新成功`);
      } catch (error) {
        console.log(`${online.name}更新失败`);
        console.log(error);
      }
      return online;
    }
  }
  const Online = mongoose.model("t_movie_online", OnlineSchema);
  
  return Online;
};
