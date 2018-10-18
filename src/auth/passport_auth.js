const passport = require('koa-passport')
const LocalStrategy = require('passport-local').Strategy
const CustomStrategy = require('./custom_strategy')

const parseToken = async (token) => {
    if (token) {
        return await fetchUser()
    }
    return null
}
const fetchUser = (() => {
    const user = { id: 1, username: 'steve', password: '123456' }
    return async function () {
        return user
    }
})()

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

passport.use(new CustomStrategy({
    name: 'jwt'
}, async (token, done) => {
    const user = await parseToken(token)
    if (user) {
        return done(null, user)
    }
    return done(null, false)
}))

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