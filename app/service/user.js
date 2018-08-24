"use strict";

const Service = require("egg").Service;
const qs = require("querystring");
class UserService extends Service {
  constructor(ctx) {
    super(ctx);
    const baseUrl = "https://graph.qq.com";
    this.config = {
      appID: 101435375,
      appKey: "91c323460e027125cdeef61365ca86f3",
      token: baseUrl + "/oauth2.0/token",
      openID: baseUrl + "/oauth2.0/me",
      get_user_info: baseUrl + "/user/get_user_info"
    };
    this.User = this.ctx.model.User;
  }

  async oauthHandle(code,state){
    const ctx = this.ctx;
    const token = await this.fetchAccessToken(code);
    const { access_token } = qs.parse(token);
    const openID = await this.fetchOpenId(access_token);
    const openidStr = openID.replace(/callback\(|\)|;/g, "");
    const { openid } = JSON.parse(openidStr);
    const userInfo = await this.getUserInfo(access_token, openid);
    const nowUser = await this.User.saveUser(openid,userInfo);
    ctx.session.user = nowUser;
    return nowUser;
  }

  async fetchAccessToken(code) {
    const sendData = {
      grant_type: "authorization_code",
      client_id: this.config.appID,
      client_secret: this.config.appKey,
      code,
      redirect_uri: encodeURI("http://173gg43187.iok.la/oauth/qq")
    };
    try {
      const res = await this.ctx.curl(`${this.config.token}?${qs.stringify(sendData)}`,{
          method: 'GET'
      });
      return res.data.toString();
    } catch (error) {
      console.log(error);
    }
  }

  async fetchOpenId(access_token) {
    try {
      const res = await this.ctx.curl(`${this.config.openID}?access_token=${access_token}`,{
          method: 'GET'
      });
      return res.data.toString();
    } catch (error) {
      console.log(error);
    }
  }

  async getUserInfo(access_token, openid) {
    const sendData = {
      access_token,
      oauth_consumer_key: this.config.appID,
      openid
    };
    try {
      const res = await this.ctx.curl(`${this.config.get_user_info}?${qs.stringify(sendData)}`,{
          method: 'GET'
      });
      return JSON.parse(res.data.toString());
    } catch (error) {
      console.log(error);
    }
  }


}

module.exports = UserService;