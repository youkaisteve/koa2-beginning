# 异常处理
## 全局
根据官方文档描述,要把异常处理放在中间件链开始的位置
```js
/**
 * The default error handler is essentially a try-catch at the very beginning of the middleware chain. 
 * To use a different error handler, simply put another try-catch at the beginning of the middleware chain, and handle the error there
 */
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        ctx.status = err.statusCode || err.status || 500;
        ctx.body = {
            message: err.message
        };
    }
})
```

## 局部路由
在单独的路由内部捕获错误,设置response并返回,不会走全局异常处理
```js
/**
 * 处理局部路由的异常
 */
router.get('/error/partial', async (ctx, next) => {
    try {
        throw new Error('error/partial');
    } catch (err) {
        ctx.status = 200
        ctx.body = {
            success: false
        }
    }
})
```

## app.onerror
如果没有指定错误侦听器,便使用app.onerror,koa默认的错误侦听器,接收所有中间件链返回的错误.

使用app.on('error')指定侦听器
```js
app.on('error', async (err, ctx) => {
    console.log(err)
})
```

## ctx.app.emit
如果一个错误被捕获并且不再抛出，它将不会被传递给错误侦听器,如果需要,可以通过ctx.app.emit可将错误推送给错误侦听器
```js
ctx.app.emit('error', err, ctx)
```

## ctx.throw([status], [msg], [properties])
Helper 方法抛出一个 .status 属性默认为 500 的错误，这将允许 Koa 做出适当地响应。

允许以下组合：
```js
ctx.throw(400);
ctx.throw(400, 'name required');
ctx.throw(400, 'name required', { user: user });
```
例如 ctx.throw(400, 'name required') 等效于:
```js
const err = new Error('name required');
err.status = 400;
err.expose = true;
throw err;
```
需要注意，这些传了status的是用户级错误，并用err.expose标记.因此,我们可以在全局的errorhandler里面,通过err.expose标记,来选择是否记录日志
```js
/**
 *  这里如果err.expose为true,属于用户级错误,在中间件处理
 */
app.on('error', async (err, ctx) => {
    if (!err.expose && !module.parent) {
        console.log(err)
    }
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = {
        success: false,
        message: 'Internal Server Error.'
    }
})

app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        // 对于非用户类错误(ctx.expose=true为用户类错误),交给错误侦听器处理,返回统一的格式;否则,直接返回错误信息
        if (!err.expose) {
            ctx.app.emit('error', err, ctx)
        } else {
            // 对于未定义的status,用户类错误统一为200,由success来判断正确性
            ctx.status = err.statusCode || err.status || 200;
            ctx.body = {
                success: false,
                message: err.message
            };
        }
    }
})
```