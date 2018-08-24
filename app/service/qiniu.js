const Service = require("egg").Service;
const qiniu = require("qiniu");
const nanoid = require("nanoid");
const _ = require("lodash");
class QiniuService extends Service {
    constructor(ctx) {
        super(ctx);
        const config = ctx.app.config.richCof;
        this.config = config;
        const mac = new qiniu.auth.digest.Mac(config.qiniu.AK, config.qiniu.SK)
        const cfg = new qiniu.conf.Config()
        this.bucket = config.qiniu.bucket
        this.client = new qiniu.rs.BucketManager(mac, cfg)
        this.Hot = this.ctx.model.Movie.Hot;
        this.Movie = this.ctx.model.Movie.Movie;
    }
    _sleep(time){
        return new Promise(resolve => {
            setTimeout(resolve,time);
        })
    }
    // 上传封装
    async _uploadToQiniu(url, key) {
        return new Promise((resolve, reject) => {
            console.log(url, key);
            this.client.fetch(url, this.bucket, key, (err, ret, info) => {
                if (err) {
                    reject(err)
                } else {
                    if (info.statusCode === 200) {
                        resolve({
                            key
                        })
                    } else {
                        reject(info)
                    }
                }
            })
        })
    }
    // hot推荐 视频地址
    async hotQiniuUpdate(hot) {
        if (hot.video && !hot.videoKey) {
            try {
                let videoData = await this._uploadToQiniu(hot.video, `${nanoid()}.mp4`);
                let coverData = await this._uploadToQiniu(hot.cover, `${nanoid()}.jpg`);
                if (videoData.key) {
                    hot.videoKey = this.config.qiniu.cname + videoData.key
                }
                if (coverData.key) {
                    hot.coverKey = this.config.qiniu.cname + coverData.key
                }
                return hot;
            } catch (error) {
                console.log(error);
            }
        }
    }

    // 上传 电影家园 电影封面
    async homeQiniuUpdate() {
        const query = {
            $and: [{
                cover: {
                    $exists: false
                },
                img: {
                    $exists: true
                }
            }]
        }
        try {
            const res = await this.Movie.find(query).limit(10).exec();
            if(res.length === 0) return;
            
            const allPro = res.map( o => {
                const len = o.img.length;
                let str = o.img.substr(len - 3, len);
                str = ["png","jpg"].indexOf(str) !== -1 ? "jpg" : str;
                return this._uploadToQiniu(o.img, `movie_home_${o.id}.${str}`);
            })
            const all = await Promise.all(allPro);
            const allSave = res.map((o,i) => {
                o.cover = all[i].key;
                return o.save();
            })
            const saveDown = await Promise.all(allSave);
            await this._sleep(5000);
            this.homeQiniuUpdate();
        } catch (error) {
            console.error(error);
        }
    }
}

module.exports = QiniuService;