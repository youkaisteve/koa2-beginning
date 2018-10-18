# jwt授权认证

## 使用koa-passport

安装passport相关包
```bash
docker exec -it -w /koa2 koa2-beginning npm install koa-passport passport-local --save
```

在启动server之前，需要初始化passport并实现serializeUser和deserializeUser
```js
const passport = require('koa-passport')
// ...
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await fetchUser()
        done(null, user)
    } catch (err) {
        done(err)
    }
})

```

## 引入需要用到的策略

```js
// CustomStrategy是我自定义的策略，用于实现JWT认证，详情可参考src/auth/custom_strategy.js
passport.use(new CustomStrategy({
    name: 'jwt'
}, async (token, done) => {
    const user = await parseToken(token)
    if (user) {
        return done(null, user)
    }
    return done(null, false)
}))

// LocalStrategy 用于实现用户名和密码登录，必须是username和password
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await fetchUser()
        if (user.username === username && user.password === password) {
            done(null, user)
        } else {
            done(null, false)
        }
    } catch (err) {
        done(err)
    }
}))
```

### serializeUser和deserializeUser实现原理
```
passport.serializeUser(function(user, done) {
    done(null, user.id);
});              │
                 │ 
                 │
                 └─────────────────┬──→ saved to session
                                   │    req.session.passport.user = {id: '..'}
                                   │
                                   ↓           
passport.deserializeUser(function(id, done) {
                   ┌───────────────┘
                   │
                   ↓ 
    User.findById(id, function(err, user) {
        done(err, user);
    });            └──────────────→ user object attaches to the request as req.user   
});
```

## login with passport.local

话不多说，直接上代码
```js
router.post('/login', async (ctx, next) => {
    return passport.authenticate('local', (err, user, info) => {
        if (!user) {
            ctx.throw(401, 'username or password invalid')
        } else {
            ctx.set('x-token', '1')
            ctx.status = 200
            ctx.body = {
                success: true
            }
        }
    })(ctx)
})
```

## authenticate with jwt strategy(self defined)

推荐在路由前面引入该middleware，这样就可以在任何路由上进行认证
```js
// 只需要一句代码
app.use(passport.authenticate('jwt', { session: false }))
```

认证的时候可以这样做
```js
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
```

## test
```bash
docker exec -it -w /koa2 koa2-beginning npm test

>>>
> koa2-beginning@0.0.1 test /koa2
> mocha



  Auth
    POST /login
      right credential
        ✓ should 200 & success=true & x-token=1 (41ms)
      wrong credential
        ✓ should 401 & success=false
    GET /auth/info
      authorize
        ✓ should 200 & success=true & info=authenticated
      unauthorized
        ✓ should 403
```