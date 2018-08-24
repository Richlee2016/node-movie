module.exports = () => {
  return async function errorHandler(ctx, next) {
    try {
      if(typeof ctx.body == 'object'){
        console.log('错误返回中间件');
      };
      await next();
    } catch (err) {
      throw Error(err);
    }
  };
};
