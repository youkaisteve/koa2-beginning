# 项目结构
## 利用docker来运行nodejs项目,采用node:10-alpine镜像

```bash
docker pull node:10-alpine
```

## 创建docker容器卷node_modules10,作为node10相关应用的包引用
```bash
docker volume create node_modules10
```

## 创建项目及运行koa2
```
# 创建项目目录
mkdir /path/to/koa2-beginning

# 初始化package.json并创建index文件
|____src
|   |____index.js
|   |____package.json

# package.json指定启动脚本
{
    ...
    "scripts": {
        "start": "node index.js"
    },
    ...
}


# 运行容器,指定宿主机的3001端口映射到容器的3000端口,这样每个应用在容器内部都是3000,外部可根据不同项目指定不同端口
docker run -itd -p 3001:3000 -v ~/workspace/research/koa2_beginning/src:/koa2 -v node_modules10:/koa2/node_modules --name koa2-beginning node:10-alpine

# 安装koa2
```text
docker exec -it -w /koa2 koa2-beginning npm install koa --save

# 修改index.js
const Koa = require('koa');
const app = new Koa();

// response
app.use(ctx => {
    ctx.body = 'Hello Koa';
});

app.listen(3000);

# 运行
docker exec -it -w /koa2 koa2-beginning npm start

# 访问
curl -L 127.0.0.1:3001
```
## 自动刷新
使用nodemon帮助我们进行自动刷新
```bash
docker exec -it w /koa2 koa2-beginning npm install koa --save-dev
```
修改npm启动命令,在scripts下增加dev
```json
"dev":"./node_modules/.bin/nodemon -L index.js"
```
这里需要使用-L参数,否则在docker容器中不会自动重启,参考nodemon官方自述:
```text
In some networked environments (such as a container running nodemon reading across a mounted drive), you will need to use the legacyWatch: true which enables Chokidar's polling.

Via the CLI, use either --legacy-watch or -L for short:
```
重新运行容器
```bash
docker exec -it -w /koa2 koa2-beginning npm run dev

>>>
> koa2-beginning@0.0.1 dev /koa2
> nodemon -L index.js

[nodemon] 1.18.3
[nodemon] to restart at any time, enter `rs`
[nodemon] watching: *.*
[nodemon] starting `node index.js`
```
现在尝试修改代码,发现已经可以自动重启了
```bash
[nodemon] restarting due to changes...
[nodemon] starting `node index.js`
```

## 单元测试
单元测试框架使用 mocha + supertest
```bash
docker exec -it -w /koa2 koa2-beginning npm install supertest mocha --save-dev
```
添加test文件夹,添加body_parsing.js
```
|____src
|   |____test
|   |    |____body_parsing.js
```
```js
const app = require('../index');
const server = app.listen();
const request = require('supertest').agent(server);

describe('Body Parsing', function () {
    after(function () {
        server.close();
    });

    describe('POST /uppercase', function () {
        describe('with JSON', function () {
            it('should work', function (done) {
                request
                    .post('/uppercase')
                    .send({ name: 'tobi' })
                    .expect(200)
                    .expect({ name: 'TOBI' }, done);
            });
        });

        describe('with urlencoded', function () {
            it('should work', function (done) {
                request
                    .post('/uppercase')
                    .send('name=tj')
                    .expect(200)
                    .expect({ name: 'TJ' }, done);
            });
        });

        describe('when length > limit', function () {
            it('should 413', function (done) {
                request
                    .post('/json')
                    .send({ name: Array(5000).join('a') })
                    .expect(413, done);
            });
        });

        describe('when no name is sent', function () {
            it('should 400', function (done) {
                request
                    .post('/uppsercase')
                    .send('age=10')
                    .expect(400, done);
            });
        });
    });
});
```
修改index.js,以适应单元测试
```js
const Koa = require('koa');
const koaBody = require('koa-body')

// export Koa app
const app = module.exports = new Koa();

app.use(koaBody({
    jsonLimit: '1kb'
}))

app.use(async (ctx) => {
    const body = ctx.request.body;
    if (!body.name) ctx.throw(400, '.name required');
    ctx.body = { name: body.name.toUpperCase() };
})

// if test/*.js has require('index.js'),module.parent will not be null
if (!module.parent) app.listen(3000);
```

修改package.json,添加test
```json
{
  ...
  "scripts": {
    "test": "mocha",
    ...
  },
  ...
}
```

执行测试
```bash
docker exec -it -w /koa2 koa2-beginning npm test

>>>
> koa2-beginning@0.0.1 test /koa2
> mocha



  Body Parsing
    POST /uppercase
      with JSON
        ✓ should work (46ms)
      with urlencoded
        ✓ should work
      when length > limit
        ✓ should 413
      when no name is sent
        ✓ should 400


  4 passing (76ms)
```