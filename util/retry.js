
module.exports = {
    retryWithThrottling: retryWithThrottling
};

function retryWithThrottling (proc, options) {
    options = options || {};

    var interval = Math.max(options.initialInterval || 500, 1);
    var maxInterval = Math.max(options.maxInterval || 60000, interval);
    var maxAttempts = options.maxAttempts || 9007199254740992;
    var failProc = options.failProc || function () {};
    var attempt = 0;

    proc(function retry (err) {
        attempt += 1;
        if (attempt >= maxAttempts) {
            if (failProc) {
                failProc(err);
            }
        } else {
            setTimeout(function () {
                interval = Math.min(interval*2, maxInterval);
                proc(retry);
            }, interval);
        }
    });
}
