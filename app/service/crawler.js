const Service = require("egg").Service;
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const _ = require("lodash");
const HOME = "http://www.idyjy.com"
const ONLINE = "http://www.dy280.com/"

const online = {
  MENU: Symbol("online-menu"),
  CLASSIFY: Symbol("online-classify"),
  MOVIE: Symbol("online-movie"),
  HOME: Symbol("oneline-home"),
  ONE: Symbol("box-one"),
  TWO: Symbol("box-two"),
  PLAY: Symbol("online-play"),
  TAG: Symbol("online-tag"),
  SEARCH:Symbol("online-search")
};

class CrawlerService extends Service {
  constructor(ctx) {
    super(ctx);
    this.ONLINE = ONLINE;
    this.HomeMovieConfig = {
      sub: id => `${HOME}/sub/${id}.html`,
      page: HOME,
      newest: `${HOME}/w.asp?p=1&f=3&l=t`,
      bili: s => `https://search.bilibili.com/all?keyword=${s}&from_source=banner_search`,
      search:w => `http://so.idyjy.com/s.asp?w=${w}`
    }
    this.OnlineMovieConfig = {
      menu: num => `${ONLINE}/index.php?m=vod-list-id-${num}.html`,
      newest: `${this.prefix}new.html`, //每天更新
      rank: `${this.prefix}top.html`, //每天更新
      topic: `${this.prefix}topic.html`, //每三天更新
      movie: id => `${this.prefix}vod/${id}.html`,
      search:wd => `http://www.dy280.com/index.php?m=vod-search&wd=${wd}`
    }
    this.Movie = this.ctx.model.Movie.Movie;
    this.Page = this.ctx.model.Movie.Page;
  }


  /**
   * 更新电影家园电影
   */
  async updateMovieHome() {
    try {
      const sleep = time => new Promise(resolve => {
        setTimeout(resolve, time);
      })
      const browser = await puppeteer.launch();

      const page = await browser.newPage();

      await page.goto(this.HomeMovieConfig.newest, {
        waitUntil: 'networkidle2',
        timeout: 3000000
      });

      await sleep(5000);

      // 获取到页面最新电影ID
      const maxId = await page.evaluate(() => {
        var $ = window.jQuery;
        var list = $(".movielist li>a");
        var idList = $.map(list, function (o, i) {
          return $(o).attr("href").match(/\d+/g)[0] || ""
        })
        return Math.max.apply(Math, idList);
      });
      console.log("maxId:", maxId);
      // 递归添加新电影
      const setMovie = async () => {
        // 获取数据库最新ID
        const [dbLastData] = await this.Movie.find().sort({
          _id: -1
        }).limit(1).exec();
        const dbLastId = dbLastData.id;

        if (maxId > dbLastId) {
          console.log(maxId, dbLastId);
          const uuid = dbLastId + 1;
          console.log("src", this.HomeMovieConfig.sub(uuid));
          await page.goto(this.HomeMovieConfig.sub(uuid), {
            waitUntil: 'networkidle2',
            timeout: 3000000
          });

          await sleep(5000);

          //获取新电影 内容
          const getNewMovie = await page.evaluate(() => {
            var $ = window.jQuery;

            if ($("#main").size() === 0) {
              return {
                name: "none"
              };
            }

            function Html() {
              this.data = {}
              this.reg = {
                num: /(\d+)/g,
                china: /[\u4e00-\u9fa5]+/g
              }
              this.init();
            }

            Html.prototype = {
              init: function () {
                this.data = {
                  name: $("#name").text(),
                  img: $(".pic img").attr("original") || $(".pic img").attr("src"),
                  intro: $(".mox .endtext").text(),
                  catalog: this._mptext($(".location a")),
                  isFinish: true
                }
                this.info();
                this.geturl();
              },
              info: function () {
                var data = {};
                var that = this;
                $(".info ul li").each(function (i, o) {
                  var span = $(o).find("span").text();
                  if (span === "又名：" || span === "IMDB：") {
                    $(o).remove();
                  };
                  switch (span) {
                    case "更新至：":
                      data.isFinish = false;
                      break;
                    case "上映年代：地区：":
                      var ya = that._ya($(o));
                      data.year = ya.year;
                      data.area = ya.area;
                      break;
                    case "类型：":
                      data.classify = that._mptext($(o).find(">a"))
                      break;
                    case "导演：":
                      data.director = that._mptext($(o).find(">a"))
                      break;
                    case "主演：":
                      data.actor = that._mptext($(o).find(">a"))
                      break;
                  }
                })
                this.data = $.extend({}, this.data, data);
              },
              geturl: function () {
                var list = $(".down_list");
                var data = {};
                var allList = []
                $.map(list, function (o, i) {
                  var boxs = $(o).find(">ul li");
                  var mylist = $.map(boxs, function (n, j) {
                    return {
                      title: $(n).find(".down_part_name a").text(),
                      url: $(n).find("input").val(),
                      size: $(n).find(".file-size").text()
                    }
                  })
                  allList.push(mylist);
                  return mylist;
                })
                data.url = allList;
                this.data = $.extend({}, this.data, data);
              },
              _ya: function (dom) {
                var go = dom.find("span").remove();
                var text = dom.text().trim();
                return {
                  year: text.match(this.reg.num)[0] || "",
                  area: text.match(this.reg.china)[0] || ""
                }
              },
              _mptext: function (list) {
                return $.map(list, function (o, i) {
                  return $(o).text();
                })
              },
              _outspan: function (n) {
                var go = $(".info ul li").eq(n).find("span").remove();
                return text = $(".info ul li").eq(n).text().trim();
              }
            }
            var _html = new Html();
            return _html.data;
          });
          console.log("getNewMovie", getNewMovie.name);
          const _movie = await this.Movie.movieSave(Object.assign(getNewMovie, {
            id: uuid
          }));
          await setMovie();
        };
      }
      await setMovie();
      console.log(`最新电影为${maxId}，已经完成更新，关闭浏览器`);
      await browser.close();

    } catch (error) {
      console.log(error);
      this.updateMovieHome();
    }

  }

  //电影家园首页
  async updateMovieIndex() {
    const ctx = this.ctx;
    try {
      const reqHtml = await ctx.curl(HOME, {
        dataType: "text"
      });
      const list = this._pageMovieHandle(reqHtml.data);
      return list;
    } catch (error) {
      console.error(error);
    }
  }

  _pageMovieHandle(html) {
    const $ = cheerio.load(html);
    const pageAttr = dom => {
      const info = cla => dom.find(`.${cla} info`).text();
      var reg = /\d+/g;
      return dom
        .find("a")
        .attr("href")
        .match(reg)[0]
      // return {
      // img: dom.find("img").attr("original"),
      // name: dom.find("a").attr("title"),
      // year: dom
      //   .find(".pLeftTop info")
      //   .eq(0)
      //   .text(),
      // score: info("pRightBottom"),
      // episodes: info("pLefpLeftBottomtTop"),
      //   id: dom
      //     .find("a")
      //     .attr("href")
      //     .match(reg)[0]
      // };
    };

    const banners = $(".moxhotcoment li").get();
    const boxs = $(".box").get();

    const banner = banners.map(o => pageAttr($(o)));
    const box = boxs.map(o => {
      const titles = $(o)
        .find("dd a")
        .get();
      const lists = $(o)
        .find("li")
        .get();
      return {
        title: titles.map(i => $(i).text()),
        list: lists.map(i => pageAttr($(i)))
      };
    });
    let allIds = [].concat(banner)
    box.forEach(o => {
      allIds = allIds.concat(o.list);
    })
    return allIds;
  }

  /**
   * 更新在线电影 menu
   */
  async updateOnlineMenu() {
    const ctx = this.ctx;
    let type = [1, 2, 3, 4];
    let proArr = type.map(o => {
      return ctx.curl(this.OnlineMovieConfig.menu(o), {
        dataType: "text"
      });
    });
    try {
      const reqHtml = await Promise.all(proArr);
      const menuList = reqHtml.map(o => this[online.MENU](o.data));
      return menuList;
    } catch (error) {
      console.error(error);
    }
  }

  // 代理搜索
  async proxyOnlineSearch(wd){
    console.log(this.OnlineMovieConfig.search(encodeURIComponent(wd)));
    const ctx = this.ctx;
    try {
      const res = await ctx.curl(this.OnlineMovieConfig.search(encodeURIComponent(wd)),{
        dataType: "text"
      });
      if(res.data.includes(400)) return;
      return this[online.SEARCH](res.data);
    } catch (error) {
      console.log(error);
    }
  }

  // 抓取分类页面、
  async onlineClassify(href) {
    const ctx = this.ctx;
    try {
      const reqHtml = await ctx.curl(`${this.ONLINE}${href}`, {
        dataType: "text"
      });
      const list = await this[online.CLASSIFY](reqHtml.data);
      return list;
    } catch (error) {
      console.error(error);
    }
  }

  // 抓取电影
  async onlineMovie(id) {
    const ctx = this.ctx;
    try {
      const reqHtml = await ctx.curl(this.OnlineMovieConfig.movie(id), {
        dataType: "text"
      });
      const movie = await this[online.MOVIE](reqHtml, id);
      return movie;
    } catch (error) {
      console.error(error);
    }
  }

  // 抓取首页
  async onlineHome(href) {
    const ctx = this.ctx;
    if (href !== '/home/') return;
    try {
      const reqHtml = await ctx.curl(this.ONLINE, {
        dataType: "text"
      });
      const home = await this[online.HOME](reqHtml.data);
      return home;
    } catch (error) {
      console.error(error);
    }
  }

  // 抓取电影、电视剧、综艺、动漫
  async onlinePlay(href, type) {
    const ctx = this.ctx;
    let listNum;
    if ([22, 23, 24, 25, 29].indexOf(type) !== -1) {
      if (type === 22) {
        listNum = 9
      }
      if (type === 23) {
        listNum = 6;
      }
      if (type === 24 || type === 25 || type === 29) {
        listNum = 2;
      }
    } else {
      return;
    }
    try {
      const reqHtml = await ctx.curl(`${this.ONLINE}${href}`, {
        dataType: "text"
      });
      const play = await this[online.PLAY](reqHtml.data, {
        listNum
      });
      return play;
    } catch (error) {
      console.error(error);
    }
  }

  //标签 
  async onlineTag(href) {
    const ctx = this.ctx;
    try {
      const reqHtml = await ctx.curl(`${this.ONLINE}${href}`, {
        dataType: "text"
      });
      const tag = await this[online.TAG](reqHtml.data);
      return tag;
    } catch (error) {
      console.error(error);
    }
  }

  // 抓取专题
  async onlineTopic(href, type) {
    const ctx = this.ctx;
    if (type !== 26) return;
    try {
      const reqHtml = await ctx.curl(`${this.ONLINE}${href}`, {
        dataType: "text"
      });
      const $ = cheerio.load(reqHtml);
      return {
        list: this._blcokTopic($),
        page: this._blockPage($)
      }
    } catch (error) {
      console.error(error);
    }
  }

  // //影片排行
  async onlineRank(href, type) {
    const ctx = this.ctx;
    if (type !== 27) return;
    try {
      const reqHtml = await ctx.curl(`${this.ONLINE}${href}`, {
        dataType: "text"
      });
      const $ = cheerio.load(reqHtml);
      const topList = [];
      const listNum = $('.hy-video-list').get().length;
      for (let i = 0; i < listNum; i++) {
        topList.push({
          head: this._blockHead(i, $, "head"),
          list: this._blockList(i, $)
        })
      }
      return topList
    } catch (error) {
      console.error(error);
    }
  }
  // //最近更新
  async onlineNewest(href, type) {
    const ctx = this.ctx;
    if (type !== 28) return;
    try {
      const reqHtml = await ctx.curl(`${this.ONLINE}${href}`, {
        dataType: "text"
      });
      const $ = cheerio.load(reqHtml);
      return {
        tab: this._blockSwitchTab(0, $),
        list: this._blockList(0, $)
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   *online html 处理
   */
  [online.SEARCH](html){
    const $ = cheerio.load(html);
    const boxs = $(".hy-layout .hy-video-details").get();
    const res = _.chain(boxs).map(o => {
      var urlReg = /.+url\((.+)\)/;
      var reReg = /(.+)：/
      const getText = (text,type) => {
        let t = text?text.replace(reReg,"") : "";
        if(type) return t;
        return t?t.split(",") : [];
      } 
      const getLi = n => $(o).find("dd ul li").eq(n).text()
      return {
        img:urlReg.test($(o).find(".videopic").attr('style'))?RegExp.$1 : "",
        title:$(o).find(".head h3").html(),
        actors:getText($(o).find(".one").text()),
        directors:getText(getLi(1)),
        area:getText(getLi(2),1),
        year:getText(getLi(3),1),
        intro:getText(getLi(4),1),
        href:ONLINE + $(o).find('.block a').attr("href").replace(/\//,"")
      }
    })
    return res;
  }
  [online.TAG](html) {
    const $ = cheerio.load(html);
    let allList = [];
    for (let i = 0; i < 2; i++) {
      allList.push(this[online.ONE]([i, i, i], $));
    }
    return {
      banner: this._blockBanner(0, $),
      screen: this._blockScreen(0, $),
      list: allList,
      pageList: {
        tag: this._blockSwitchTab(0, $),
        list: this._blockList(2, $),
        page: this._blockPage($)
      }
    }
  }
  [online.PLAY](html, {
    listNum,
    pageListNum
  }) {
    const $ = cheerio.load(html);
    let allList = [];
    for (let i = 0; i < listNum; i++) {
      allList.push(this[online.ONE]([i, i + 1, i], $));
    }
    return {
      header: {
        banner: this._blockBanner(0, $),
        tag: this._blockTags(0, $),
        rank: this._blockRank(0, $)
      },
      screen: this._blockScreen(0, $),
      list: allList,
      pageList: {
        tag: this._blockSwitchTab(0, $),
        list: this._blockList(listNum + 1, $),
        page: this._blockPage($)
      }
    }
  }

  [online.HOME](html) {
    const $ = cheerio.load(html);
    return {
      header: {
        banner: this._blockBanner(0, $),
        menu: $(".hy-index-menu a").get().map(o => {
          return {
            title: $(o).find("span").text(),
            href: $(o).attr("href")
          }
        }),
        tag: this._blockTags(0, $),
      },
      hot: this[online.ONE]([0, 0, 0], $),
      movie: this[online.TWO]([1, 1, 0, 2], $),
      tvplay: this[online.TWO]([2, 2, 1, 4], $),
      tvshow: {
        head: this._blockHead(3, $),
        banner: this._blockBanner(3, $),
        list: this._blockList(5, $),
        text: this._blockTextList(1, $)
      },
      cartoon: this[online.TWO]([4, 4, 2, 7], $),
      topic: {
        head: this._blockHead(5, $),
        list: this._blcokTopic($)
      }
    }
  }
  [online.MOVIE](html, id) {
    const $ = cheerio.load(html);
    const imgReg = /.+url\((.+)\)/;
    const imgDom = $(".videopic").attr("style");
    let conDom = $(".content ul li");
    let content;
    const nums = num =>
      conDom
      .eq(num)
      .find("a")
      .get()
      .map(o => {
        return $(o).text();
      });

    if (conDom.get().length === 7) {
      let actorDire = nums(1);
      content = {
        atype: "电视剧",
        director: actorDire.splice(0, 1),
        actor: actorDire,
        area: conDom.eq(2).find("a").text() || "",
        type: {
          text: conDom.eq(3).find("a").text(),
          href: conDom.eq(3).find("a").attr("href")
        },
        language: conDom.eq(4).text(),
        year: conDom.eq(5).text(),
        intro: conDom.eq(6).text()
      };
    } else {
      content = {
        atype: "电影",
        update: conDom.eq(1).text(),
        director: nums(2),
        actor: nums(3),
        area: conDom
          .eq(4)
          .find("a")
          .text() || "",
        type: {
          text: conDom
            .eq(5)
            .find("a")
            .text(),
          href: conDom
            .eq(5)
            .find("a")
            .attr("href")
        },
        language: conDom.eq(6).text(),
        year: conDom.eq(7).text(),
        intro: conDom.eq(8).text()
      };
    }
    const playList = $("#playlist .panel").get();
    const allPlay = playList.map(o => {
      let play = $(o)
        .find("div ul li a")
        .get();
      let list = play.map(p => {
        return {
          title: $(p).text(),
          href: $(p).attr("href")
        };
      });
      return {
        title: $(o)
          .find(".option")
          .text(),
        list
      };
    });
    const downList = $("#downlist table tbody tr").get();
    const allDown = downList.map(o => {
      return {
        title: $(o)
          .find("td")
          .eq(0)
          .find("span")
          .text(),
        href: $(o)
          .find("td")
          .eq(0)
          .find("input")
          .val()
      };
    });
    const sameList = $(".hy-video-list").get();
    const allSame = sameList.map((o, index) => {
      const aDiv = num =>
        $(o)
        .find("div")
        .eq(num);
      const listGo = $(o)
        .find(".hy-video-text-list")
        .find("div ul li a")
        .get();
      return {
        title: aDiv(0)
          .find("h3")
          .text() ||
          aDiv(0)
          .find("h4")
          .text(),
        more: aDiv(0)
          .find("a")
          .attr("href") || "",
        swiper: aDiv(1)
          .find("div a")
          .get()
          .map(s => {
            return {
              title: $(s).attr("title"),
              img: $(s).attr("data-original"),
              href: $(s).attr("href")
            };
          }),
        list: listGo.map(o => {
          return {
            title: $(o).text(),
            href: $(o).attr("href")
          };
        })
      };
    });
    const {
      update,
      director,
      actor,
      area,
      type,
      language,
      year,
      intro
    } = content;
    return {
      id,
      img: imgDom.match(imgReg) ? imgDom.match(imgReg)[1] : null,
      name: $(".head")
        .find("h1")
        .text(),
      update,
      director,
      actor,
      area,
      type,
      language,
      year,
      intro,
      play: allPlay,
      downUrl: allDown,
      introduce: $(".plot").text(),
      same: allSame
    };
  }
  [online.CLASSIFY](html) {
    const $ = cheerio.load(html);
    const navs = $(".nav-tabs li a").get();
    const boxs = $(".hy-video-list li").get();
    const nowPage = $(".hy-page span").text();
    const pages = $(".hy-page a")
      .get()
      .map(o => {
        return {
          index: $(o).text(),
          href: $(o).attr("href")
        };
      });
    return {
      nvas: navs.map(o => {
        return {
          title: $(o).text(),
          href: $(o).attr("href")
        };
      }),
      pagenum: $(".text-muted span")
        .eq(0)
        .text(),
      total: $(".text-muted span")
        .eq(1)
        .text(),
      list: boxs.map(o => {
        const a = $(o).find("a");
        return {
          img: a.attr("data-original"),
          title: a.attr("title"),
          actor: $(o)
            .find(".subtitle")
            .text(),
          href: a.attr("href")
        };
      }),
      page: [{
        index: nowPage,
        href: "nowPage"
      }].concat(pages)
    };
  }
  [online.MENU](html) {
    const $ = cheerio.load(html);
    const collapse = $("#collapse ul").get();
    const type = collapse.map(u => {
      const lis = $(u)
        .find("a")
        .get();
      return {
        title: $(u)
          .find("span")
          .text(),
        menus: lis.map((l, num) => {
          return {
            nav: $(l).text(),
            href: $(l).attr("href")
          };
        })
      };
    });
    return {
      name: $(".content-meun .head span")
        .eq(1)
        .text(),
      type
    };
  }
  [online.ONE](n, $) {
    return {
      head: this._blockHead(n[0], $),
      list: this._blockList(n[1], $),
      text: this._blockTextList(n[2], $)
    }
  }
  [online.TWO](n, $) {
    return {
      head: this._blockHead(n[0], $),
      banner: this._blockBanner(n[1], $),
      rank: this._blockRank(n[2], $),
      list: this._blockList(n[3], $)
    }
  }
  _blockSwitchTab(num, $) {
    const tab = $('.hy-switch-tabs').eq(num);
    tab
    return {
      navs: tab.find(".nav a").get().map(o => {
        return $(o).text()
      }),
      count: tab.find(".text-muted span").eq(0).text(),
      page: tab.find(".text-muted span").eq(1).text()
    }
  }
  _blockPage($) {
    const nowPage = $(".hy-page span").text();
    const pages = $(".hy-page a").get().map(o => {
      return {
        index: $(o).text(),
        href: $(o).attr("href")
      };
    });
    return [{
      index: nowPage,
      href: "nowPage"
    }].concat(pages)
  }
  _blockScreen(num, $) {
    const screen = $(".hy-min-screen").eq(num);
    return screen.find('dl').get().map(o => {
      return {
        name: $(o).find('dt').text(),
        list: $(o).find('a').get().map(a => {
          return {
            title: $(a).text(),
            href: $(a).attr('href')
          }
        })
      }
    })
  }
  _blockTags(num, $) {
    const tags = $(".hy-index-tags").eq(0);
    return tags.find("a").get().map(o => {
      return {
        name: $(o).text(),
        href: $(o).attr('href')
      }
    })
  }
  _blcokTopic($) {
    const topic = $('.hy-topic-list a').get();
    return topic.map(o => {
      return {
        name: $(o).find(".name").text(),
        count: $(o).find(".count").text(),
        href: $(o).attr('href'),
        img: $(o).attr('data-original')
      }
    })
  }
  _blockRank(num, $) {
    const rank = $(".hy-video-ranking").eq(num);
    const list = rank.find("a").get().map(o => {
      return {
        title: $(o).attr("title"),
        href: $(o).attr("href")
      }
    })
    return {
      head: this._blockHead(num, $, "min"),
      list
    }
  }
  _blockBanner(num, $) {
    const banner = $(".swiper-wrapper").eq(num);
    return banner.find("a").get().map(o => {
      return {
        title: $(o).attr("title"),
        href: $(o).attr("href")
      }
    })
  }
  _blockHead(num, $, min) {
    let head = !min ? $(".hy-video-head").eq(num) : $(".hy-video-min-head").eq(num);
    if (min === 'head') {
      head = $(".hy-video-list").eq(num).find(".head")
    }
    return {
      name: !min ? head.find('h3').text() : head.find('h4').text(),
      more: head.find('a').attr('href')
    }
  }
  _blockList(num, $) {
    const list = $('.hy-video-list').eq(num);
    return list.find(".videopic").get().map(o => {
      return {
        title: $(o).attr('title'),
        href: $(o).attr('href'),
        img: $(o).attr('data-original')
      }
    })
  }
  _blockTextList(num, $) {
    const text = $('.hy-video-text-list').eq(num);
    return text.find("a").get().map(o => {
      return {
        title: $(o).attr('title'),
        href: $(o).attr('href'),
      }
    })
  }

}

module.exports = CrawlerService;