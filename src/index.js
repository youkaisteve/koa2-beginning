const Koa = require('koa');
const koaBody = require('koa-body')
const Router = require('koa-router');

const app = module.exports = new Koa();
const router = new Router();

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
/**
 * 如果需要自定义异常处理,需要放在其他中间件前面
 * The default error handler is essentially a try-catch at the very beginning of the middleware chain. 
 * To use a different error handler, simply put another try-catch at the beginning of the middleware chain, and handle the error there
 */
app.use(async (ctx, next) => {
    try {
        await next();
    } catch (err) {
        // 对于非用户类错误(ctx.expose=true为用户类错误),交给错误侦听器处理,返回统一的格式;否则,返回用户类错误的信息,如用户名密码不对之类的
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

app.use(koaBody({
    jsonLimit: '1kb'
}))

router.post('/uppercase', async (ctx, next) => {
    const body = ctx.request.body;
    if (!body.name) ctx.throw(400, '.name required');
    ctx.body = { name: body.name.toUpperCase() };
})

router.get('/error', async (ctx, next) => {
    throw new Error('error');
})

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

/**
 * 用户级别的异常
 */
router.get('/error/userlevel', async (ctx, next) => {
    ctx.throw(401, "username or password invalid")
})

app.use(router.routes());
app.use(router.allowedMethods());

if (!module.parent) app.listen(3000);