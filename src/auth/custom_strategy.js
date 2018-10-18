const passport = require('koa-passport')

/**
 * 
 */
class CustomStrategy {
    /**
     * 
     * @param {Object | Function} options 
     * @param {Function} verify 
     */
    constructor(options, verify) {
        passport.Strategy.call(this);
        if (typeof options === 'function') {
            verify = options;
            options = {};
        }
        if (!verify)
            throw new Error('token custom authentication strategy requires a verify function');
        this._tokenHeader = options.tokenHeader ? options.tokenHeader.toLowerCase() : 'x-token';
        this.name = options.name || 'custom';
        this._verify = verify;
        this._passReqToCallback = options.passReqToCallback || false;
    }
    /**
     * 实现authenticate方法，获取到token后，交给verify（用户自定义）方法处理
     * 用户验证token后，通过verified回调函数，通知passport，成功则调用.success,如有err则调用.error,否则调用.pass跳过
     * @param {Object} req
     */
    authenticate(req) {
        let token = req.headers[this._tokenHeader];
        // 没有token，则跳过
        if (!token) {
            return this.pass();
        }
        if (this._passReqToCallback) {
            this._verify(req, token, this.verified.bind(this));
        }
        else {
            this._verify(token, this.verified.bind(this));
        }
    }
    /**
     * 
     * @param {Error} err 
     * @param {Object} user 
     * @param {*} info 
     */
    verified(err, user, info) {
        if (err) {
            return this.error(err);
        }
        if (user) {
            return this.success(user, info);
        }
        return this.pass();
    }
}

module.exports = CustomStrategy