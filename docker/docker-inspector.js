
module.exports = exported;

function exported (docker) {
    var cache = {};
    var inspecting = {};

    return inspect;

    function inspect (id, callback) {
        if (inspecting[id]) {
            inspecting[id].push(callback);
        } else {
            inspecting[id] = [callback];
            actuallyInspect(id, handleInspectResult);
        }

        function handleInspectResult (err, data) {
            var callbacks = inspecting[id];
            delete inspecting[id];

            callbacks.forEach(function (callback) {
                callback(err, data);
            });
        }
    }

    function actuallyInspect (id, callback) {
        docker.getContainer(id).inspect(function (err, data) {
            if (err) {
                callback(err, cache[id]);
            } else {
                cache[id] = data;
                callback(null, data);
            }
        });
    }
};
