const musicModel = require('../models/music.js');
const path = require('path');
/**
 * 没有获取id
 * @param  {[type]} ctx [description]
 * @return {[type]}     [description]
 */
function optUpload(ctx) {
    // 接收请求数据 
    // console.log(ctx.request.files); // 文件，根据key名
    // console.log('===========================')
    // console.log(ctx.request.body); // 字符串，根据key名
    // 1:获取字符串数据
    let { title,singer,time } = ctx.request.body;
    // 2:获取文件 ->  保存文件的网络路径（方便/public请求返回）
    let { file,filelrc } = ctx.request.files;
    //  保存文件的绝对路径也可以，但是麻烦
    let saveSingObj = {
      title,singer,time
    }

    // 为了我们后面微信小程序，也能调用这个接口
    saveSingObj.filelrc = 'no upload filelrc';

    //    2.5: 歌词可选
    if(filelrc) {
                                              // 文件路径  文件名+后缀
      saveSingObj.filelrc = '/public/files/' + path.parse(filelrc.path).base;
    }

    if(!file) {
      ctx.throw('歌曲必须上传');
      return;
    }
    // 2.7:处理歌曲路径
    saveSingObj.file = '/public/files/' + path.parse(file.path).base;

    // 2.8:加入用户id 未来使用session
    saveSingObj.uid = 1;
    return saveSingObj;
}
module.exports = {



  /**
   * 添加音乐
   * @param {[type]}   ctx  [description]
   * @param {Function} next [description]
   */
  async addMusic(ctx,next){
    let saveSingObj = optUpload(ctx);
    // 3: 插入数据到数据库
    let result = await musicModel.addMusicByObj(saveSingObj);
    // 4: 响应结果给用户
    ctx.body = {
      // ajax接收到的状态消息
      code:'001',msg:result.message
    }
  },
  /**
   * 更新音乐
   * @param  {[type]}   ctx  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  async updateMusic(ctx,next) {
      let saveSingObj = optUpload(ctx);
      let {id} = ctx.request.body;
      Object.assign(saveSingObj,{id});
      
      // 更新数据
      let result = await musicModel.updateMusic(saveSingObj);

      if(result.affectedRows !== 1) {
        // 没有更新成功(throw是针对页面的操作，ajax请求，code:002)
        ctx.body = {
          code:'002',msg:result.message
        };
        return;
      }

      ctx.body = {
        code:'001',msg:'更新成功'
      }
     
  },
  async deleteMusic(ctx,next){
    // 接收请求url中的查询字符串
    let id = ctx.request.query.id;  // ctx.query.id
    // 删除音乐
    let result = await musicModel.deleteMusicById(id);
    console.log(result);
    // 后续行为
    if(result.affectedRows === 0) {
      ctx.throw('删除失败:' + result.message);
      return;
    }

    // 响应请求
    ctx.body = {
      code:'001',
      msg:'删除成功'
    }


  },

  async showEdit(ctx,next){
      // 获取路由查询字符串参数
      let id = ctx.query.id;
      // 通过id查询音乐
      let musics = await musicModel.findMusicById(id);
      // 判断是否有该歌曲
      if(musics.length === 0) {
        // 甩异常见错误页面
        ctx.throw('歌曲不存在！');
        return;
      }
      let music = musics[0];
      // 渲染edit页面
      ctx.render('edit',{
        music:music
      })
  },
  async showIndex(ctx,next) {
    // 根据用户的session中的id来查询数据======未完成====
    let uid = ctx.session.user.id;
    // 根据id查询歌曲
    let musics = await musicModel.findMusicByUid(uid);
    // 展示给用户
    ctx.render('index',{
      musics
    })
  }
}