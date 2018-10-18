const app = require('../index')
const server = app.listen()
const request = require('supertest').agent(server)

describe('Auth', function () {
    after(function () {
        server.close()
    })
    describe('POST /login', function () {
        describe('right credential', function () {
            it('should 200 & success=true & x-token=1', function (done) {
                request
                    .post('/login')
                    .send({ username: 'steve', password: '123456' })
                    .expect(200)
                    .expect({ success: true })
                    .expect('x-token', '1', done)
            })
        })
        describe('wrong credential', function () {
            it('should 401 & success=false', function (done) {
                request
                    .post('/login')
                    .send({ username: 'steve', password: '654321' })
                    .expect(401)
                    .expect({ success: false, message: 'username or password invalid' }, done)
            })
        })
    })

    describe('GET /auth/info', function () {
        describe('authorize', function () {
            it('should 200 & success=true & info=authenticated', function (done) {
                request
                    .get('/auth/info')
                    .set('x-token', 1)
                    .expect(200)
                    .expect({ success: true, info: 'authenticated' }, done)
            })
        })
        describe('unauthorized', function () {
            it('should 403', function (done) {
                request
                    .get('/auth/info')
                    .expect(403, done)
            })
        })
    })
})