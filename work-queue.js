
module.exports = function () {
    var queue = [];
    var nextIndex = 0;

    return {
        push: function (proc) {
            queue.push(proc);
            if (nextIndex === 0) {
                next();
            }
        }
    };

    function next () {
        if (nextIndex === queue.length) {
            queue = [];
            nextIndex = 0;
        } else {
            var proc = queue[nextIndex];
            nextIndex += 1;
            proc(next);
        }
    }
};
