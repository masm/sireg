var retry = require("../helpers/retry.js");

module.exports = exported;

function exported (consul) {
    return {
        register,
        unregister,
        registered,
    };

    function register (obj, callback) {
        retryWithThrottling((callback) => consul.agent.service.register(obj, callback), callback);
    }

    function unregister (obj, callback) {
        retryWithThrottling((callback) => consul.agent.service.deregister(obj, callback), callback);
    }

    function registered (handler) {
        consul.agent.service.list(handler);
    }

};

function retryWithThrottling (proc, callback) {
    retry.retryWithThrottling(function (retry) {
        proc(function (err) {
            if (err) {
                retry(err);
            } else {
                callback(null);
            }
        });
    }, {maxAttempts: 5, failProc: callback});
}
