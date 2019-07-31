const Koa = require('koa');

// 引入两个router
const musicRouter = require('./routers/music');
const userRouter = require('./routers/user');
// const bodyParser = require('koa-bodyparser');
const formidable = require('koa-formidable');
const session = require('koa-session');

const checkLogin = require('./middleware/checkLogin');

// 创建服务器
let app = new Koa();

let { appPort,viewDir,staticDir,uploadDir } = require('./config');

// 开启服务器
app.listen(appPort,()=>{
  console.log(`服务器启动在${appPort}端口`);
});

// 模板渲染
const render = require('koa-art-template');
render(app, {
  root: viewDir,
  extname: '.html',
  debug: process.env.NODE_ENV !== 'production'
});


// 中间件使用列表 app.use

// 优雅的处理异常
let rewriteUrl = require('./middleware/rewrite')
let error = require('./middleware/error')
app.use(error());
// 为了给static重写URL
app.use(rewriteUrl(require('./rewriteUrlConfig')));

//处理静态资源
app.use(require('koa-static')(staticDir));
let store = {
  storage:{},
  set(key,session) {
    this.storage[key] = session;
  },
  get(key){
    return this.storage[key];
  },
  destroy(key){
    delete this.storage[key];
  }
}
app.keys = ['test'];
// 基于test字符串进行签名的运算，为的是保证数据不被串改
// 处理session
app.use(session({store:store},app));

// 判断某些页面url的时候是否有session上的url(登陆)
app.use(checkLogin);


// 必须在每次请求挂载新的数据与视图的桥梁(在session之后)
app.use(async (ctx,next)=>{
  // express app.locals 视图与数据的桥梁
  ctx.state.user = ctx.session.user;
  // 最终都放行
  await next();
});

// 处理请求体数据 ctx.request.body获取
// app.use(bodyParser());

/**
 * 注意这里: 1:最初使用formidable接收文件，但是头是键值对的头，
 * 所以formidable帮我们将数据解析键值对了，打印出来数据非常多
 * 2:使用bodyParser的时候，仍然是键值对的头，他解析的时候，里面包含文件，所以报错 too large  请求体太大
 */

// 处理文件及字符串
app.use(formidable({
  // 设置上传目录，否则在用户的temp目录下
  uploadDir:uploadDir,
  // 默认根据文件算法生成hash字符串（文件名），无后缀
  keepExtensions:true
}));

app.use(userRouter.routes());
app.use(musicRouter.routes());

//处理405 方法不匹配 和 501 方法未实现
app.use(userRouter.allowedMethods());

// 中间件使用列表  结束