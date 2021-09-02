import fs from 'fs'
import path from 'path'
// 好像现在没用了
var copy = function (src, dst) {
  let paths = fs.readdirSync(src); //同步读取当前目录
  paths.forEach(function (path) {
    var _src = src + '/' + path;
    var _dst = dst + '/' + path;
    fs.stat(_src, function (err, stats) {  //stats  该对象 包含文件属性
      if (err) throw err;
      if (stats.isFile()) { //如果是个文件则拷贝 
        let readable = fs.createReadStream(_src);//创建读取流
        let writable = fs.createWriteStream(_dst);//创建写入流
        readable.pipe(writable);
      } else if (stats.isDirectory()) { //是目录则 递归 
        checkDirectory(_src, _dst, copy);
      }
    });
  });
}
var checkDirectory = function (src, dst, callback) {
  fs.access(dst, fs.constants.F_OK, (err) => {
    if (err) {
      fs.mkdirSync(dst);
      callback && callback(src, dst);
    } else {
      callback && callback(src, dst);
    }
  });
};



module.exports = function () {
  const files = fs
    .readdirSync('./public')
    .map((f) => ({ name: f.split('.')[0] }))

  const imports = files.map((f) => `import ${f.name} from '${f.importPath}'`)

  const routes = files.map(
    (f) => `{
        name: '${f.name}',
        path: '/${f.name}',
        component: ${f.name},
      }
      `,
  )

  return {
    buildStart() {
      console.log("buildStart---------------------------------")
    },
    buildEnd() {
      checkDirectory(path.resolve('./public'), path.resolve('./dist'));
    }
  }
}