const app = require('../index');
const server = app.listen();
const request = require('supertest').agent(server);
describe('Error Handling', function () {
    after(function () {
        server.close();
    });
    describe('with throw Error(\'error\')', function () {
        it('should work', function (done) {
            request
                .get('/error')
                .expect(500)
                .expect({ success: false, message: 'Internal Server Error.' }, done);
        })
    })
    describe('with throw Error(\'error/partial\')', function () {
        it('should 200 & success=false', function (done) {
            request
                .get('/error/partial')
                .expect(200)
                .expect({ success: false }, done);
        })
    })
    describe('with ctx.throw', function () {
        it('should word', function (done) {
            request
                .get('/error/userlevel')
                .expect(401)
                .expect({ success: false, message: 'username or password invalid' }, done);
        })
    })
})