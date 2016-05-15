var argv = require("yargs")
        .default("consulHost", null)
        .default("consulPort", null)
        .argv;

if (argv.consulHost) {
    process.env["CONSUL_HOST"] = argv.consulHost;
}

if (argv.consulPort) {
    process.env["CONSUL_PORT"] = argv.consulPort;
}

var os = require("os");
var dockerode = require("dockerode");
var serviceEvents = require("./service-events.js");
var configLookup = require("./helpers/config.js");
var workQueue = require("./helpers/work-queue.js");

var consulHost = configLookup("CONSUL_HOST");
var consulPort = process.env["CONSUL_PORT"] || 8500;
var consul = require("consul")({host: consulHost, port: consulPort});

var consulService = require("./consul/service.js")(consul);

var docker = dockerode({socketPath: '/var/run/docker.sock'});

main();

function main () {
    var events = serviceEvents(docker, consulService);
    var queue = workQueue();

    events.on("start", function (service) {
        queue.push(function (done) {
            registerService(service, done);
        });
    });

    events.on("stop", function (service) {
        queue.push(function (done) {
            unregisterService(service, done);
        });
    });

    events.on("theEnd", function () {
        console.warn("No more events from docker. Exiting...");
        process.exit(1);
    });
}

function registerService (data, done) {
    console.log("registering", data.id);
    consulService.register(data, function (err) {
        if (err) {
            console.warn(err);
        } else {
            console.log("registered", data.id);
        }
        done();
    });
}

function unregisterService (data, done) {
    console.log("unregistering", data.id);
    consulService.unregister(data, function (err) {
        if (err) {
            console.warn(err);
        } else {
            console.log("unregistered", data.id);
        }
        done();
    });
}
