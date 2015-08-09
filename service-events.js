var _ = require("lodash");
var events = require("events");

module.exports = exported;

function exported (docker) {
    var eventEmitter = new events.EventEmitter();
    var inspectContainer = require("./docker/docker-inspector.js")(docker);

    setup();

    return eventEmitter;

    function setup () {
        var dockerEvents = require("./docker/docker-events.js")(docker);

        dockerEvents.on("start", processStart);
        dockerEvents.on("die", processDie);
        dockerEvents.on("theEnd", function () {
            eventEmitter.emit("theEnd");
        });

        var bootEvents = require("./docker/docker-events-from-list")(docker);

        bootEvents.on("running", processStart);

    }

    function processStart (event) {
        inspectContainer(event.id, function (err, data) {
            if (err) {
                // ignore
            } else {
                var services = parseEnv(data.Config.Env);
                if (services) {
                    services.forEach(function (service) {
                        service.ip = data.NetworkSettings.IPAddress;
                        eventEmitter.emit("start", service);
                    });
                }
            }
        });
    }

    function processDie (event) {
        inspectContainer(event.id, function (err, data) {
            if (err && !data) {
                // ignore
            } else {
                var services = parseEnv(data.Config.Env);
                if (services) {
                    services.forEach(function (service) {
                        eventEmitter.emit("stop", service);
                    });
                }
            }
        });
    }
}

function parseEnv (strings) {
    var obj = strings.map(function (string) {
        var m = string.match(/^SERVICE_(\d+)\_([^=]*)=(.*)/);
        return m && {
            port: m[1],
            name: m[2],
            value: m[3]
        };
    }).reduce(function (acc, v) {
        if (v) {
            if (!acc[v.port]) {
                acc[v.port] = {};
            }
            acc[v.port][v.name.toLowerCase()] = v.value;
        }
        return acc;
    }, {});
    var array = Object.keys(obj).map(function (key) {
        if (obj[key].name) {
            return {
                port: parseInt(key, 10),
                properties: obj[key]
            };
        } else {
            return false;
        }
    }).filter(_.identity);
    return array.length === 0 ? null : array;
}
