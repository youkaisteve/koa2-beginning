const Router = require('koa-router')
const router = new Router()
const passport = require('koa-passport')

module.exports = function (app) {
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
        ctx.throw(401, 'username or password invalid')
    })

    /**
     * local 登录
     */
    router.post('/login', async (ctx, next) => {
        return passport.authenticate('local', (err, user, info) => {
            if (!user) {
                ctx.throw(401, 'username or password invalid')
            } else {
                ctx.set('x-token', 1)
                ctx.status = 200
                ctx.body = {
                    success: true
                }
            }
        })(ctx)
    })

    const authMiddleware = (ctx, next) => {
        // 特别注意：passport.serializeUser方法执行后，user是写到了node的req上，而不是ctx.request
        // 要判断是否登录，需要用ctx.isAuthenticated()
        if (ctx.isAuthenticated()) {
            next()
        } else {
            ctx.throw(403)
        }
    }

    router.get('/auth/info', authMiddleware, async (ctx, next) => {
        ctx.status = 200
        ctx.body = {
            success: true,
            info: 'authenticated'
        }
    })

    app.use(router.routes());
    app.use(router.allowedMethods());
}