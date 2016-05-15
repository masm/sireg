var _ = require("lodash");
var events = require("events");
var dockerInspector = require("./docker/docker-inspector.js");
var dockerEvents = require("./docker/docker-events.js");
var dockerEventsFromList = require("./docker/docker-events-from-list");

module.exports = exported;

function exported (docker) {
    var eventEmitter = new events.EventEmitter();
    var inspectContainer = dockerInspector(docker);

    setup();

    return eventEmitter;

    function setup () {
        var events = dockerEvents(docker);

        events.on("start", processStart);
        events.on("die", processDie);
        events.on("theEnd", function () {
            eventEmitter.emit("theEnd");
        });

        var bootEvents = dockerEventsFromList(docker);

        bootEvents.on("running", processStart);
    }

    function processStart (event) {
        inspectContainer(event.id, function (err, data) {
            if (err) {
                // ignore
            } else {
                var services = parseEnv(data.Config.Env);
                services.forEach(function (service) {
                    service.ip = data.NetworkSettings.IPAddress;
                    eventEmitter.emit("start", service);
                });
            }
        });
    }

    function processDie (event) {
        inspectContainer(event.id, function (err, data) {
            if (err && !data) {
                // ignore
            } else {
                var services = parseEnv(data.Config.Env);
                services.forEach(function (service) {
                    eventEmitter.emit("stop", service);
                });
            }
        });
    }
}

function parseEnv (strings) {
    var obj = servicesPropertiesByPort(strings);
    return  Object.keys(obj).map(function (port) {
        return obj[port].name && {
            port: parseInt(port, 10),
            properties: obj[port]
        };
    }).filter(_.identity);
}

function servicesPropertiesByPort(strings) {
    return strings.map(function (string) {
        var m = string.match(/^SERVICE_(\d+)\_([^=]*)=(.*)/);
        return m && {
            port: m[1],
            name: m[2],
            value: m[3]
        };
    }).filter(_.identity).reduce(function (acc, v) {
        return Object.assign(acc, {[v.port]: Object.assign(acc[v.port] || {}, {[v.name.toLowerCase()]: v.value})});
    }, {});
}
