"use strict";

module.exports = app => {
  const { router, controller } = app;

  /**Page 页面 */
  const Home = controller.home;
  // Page
  router.get("/", Home.index); //首页
  router.get("/home", Home.home); //电影首页
  router.get("/vod/:id", Home.vod); //电影详情
  router.get("/list", Home.list); //电影列表
  router.get("/group/:type", Home.group); //电影组
  router.get("/search", Home.search); //电影搜索
  // Error
  router.get("/nosorce", Home.noSorce); //无资源页面

  /**User 用户*/
  const User = controller.user;
  router.get("/oauth/qq", User.index); //oauth请求
  router.get("/user/test", User.crawlerMovieIndex); //测试请求
  /**
   * API 接口
   *
   * Movie
   *
   */
  /**Movie */
  const Movie = controller.movie;
  router.get("/Movie/GetMovieList", Movie.getMovieList); //筛选电影
  router.get("/Movie/GetMovieVod/:id", Movie.getMovieVod); //单个电影
  router.get("/Movie/GetGroup", Movie.getGroup); //获取分组
  router.post("/Movie/CreateGroup", Movie.createGroup); //创建分组
  router.post("/Movie/UpdateGroup", Movie.updateGroup); //修改分组
  /**Online */
  const Online = controller.online;
  router.get("/Online/Search", Online.search); //搜索代理
};
