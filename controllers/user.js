const userModel = require('../models/user');
const captchapng = require('captchapng2');
module.exports = {
  showRegister:async (ctx,next)=>{
      // let users = await userModel.getUsers();
      // console.log(users);
      ctx.render('register');
  },
  /**
   * 检查用户名是否存在
   * @param  {[type]}   ctx  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  checkUsername:async (ctx,next) => {
    // 处理接受请求之类的繁琐事务，唯独不CRDU
    let { username } = ctx.request.body;
    // 查询数据库中是否存在该用户名
    let users = await userModel.findUserByUsername(username);
    // 判断users数组的长度是否为0
    if(users.length === 0) {
      ctx.body = {  code:'001',msg:'可以注册'};
      return;
    }

    // 存在该用户
    ctx.body = { code :'002',msg:'用户名已经存在'};
  },
  /**
   * 注册
   * @param  {[type]}   ctx  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  doRegister: async (ctx,next) => {
    let { username,password,email,v_code } = ctx.request.body;
   // 比较v_code
   if(v_code !== ctx.session.v_code) {
      ctx.body = {
        code:'002',
        msg:'验证码不正确'
      };
      return;
   }

    // 判断用户名是否存在
    let users = await userModel.findUserByUsername(username);
    // 判断是否可以注册
    if(users.length !== 0) {
      ctx.body = {  code:'002',msg:'用户名已经存在！'};
      return;
    }

   try {
     // 开始注册(可以做异常捕获)
      let result = await userModel.registerUser(username,password,email);

      // insertId  rows  判断是否插入成功，再给予提示
      // console.log(result);
      if (result.affectedRows === 1) {
        ctx.body = { code: '001',msg:'注册用户成功'}
        return;
      } 

      // 不等于1的情况会发生在id冲突，就不插入数据
      ctx.body = { code:'002' , msg:result.message };
    }catch(e) {
      // 判断e的一些信息 code
      ctx.throw('002');
    }


  },
  /**
   * 登录
   * @param  {[type]}   ctx  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  async doLogin(ctx,next){
      // 1:接收参数
      let { username,password } = ctx.request.body;
      // 2:查询用户名相关的用户
      let users = await userModel.findUserDataByUsername(username);
      // 2.5: 判断是否用用户
      if(users.length === 0) {
        // 没有该用户
        ctx.body = { 
          // 避免黑客等试探用户名正确的情况，模糊错误
          code:'002',msg:'用户名或密码不正确'
        };
        return;
      }
      let user = users[0]; // 注册我们必须控制死，不能存在相同用户名的数据。所以放心的取吧
      // 3:对比密码是否一致
      
      if (user.password === password ) {
         // 3.1: 如果密码正确，认证用户 session放属性区分是否登录
        ctx.body = { code:'001',msg:'登录成功'  };
        // 挂在session用户认证判断
        ctx.session.user = user; 
        return;
      }
      // 3.2: 响应json结果: CODE:002
      ctx.body = { code:'002',msg:'用户名或密码不正确'};
  },
  /**
   * 获取验证码图片
   * @param  {[type]}   ctx  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  getPic(ctx,next){
    let rand = parseInt(Math.random() * 9000 + 1000);
    // 区分不同用户的答案，并分配session，响应cookie
    ctx.session.v_code = rand+'';

    let png = new captchapng(80, 30, rand); // width,height, numeric captcha
    ctx.body = png.getBuffer();
  },
  /**
   * 就两句话，1：清除session上的user
   * 2: 重定向一个页面到login
   * @return {[type]} [description]
   */
  async logout(ctx,next) {
    ctx.session.user = null;
    ctx.redirect('/user/login');
  }
}