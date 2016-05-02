var os = require("os");
var _ = require("lodash");
var dockerode = require("dockerode");
var retry = require("./util/retry.js");

var argv = require("yargs")
        .demand("consulHost")
        .default("consulPort", 8500)
        .argv;

var consul = require("consul")({
    host: argv.consulHost,
    port: argv.consulPort
});

var containerData = {};

var docker = dockerode({socketPath: '/var/run/docker.sock'});

var workQueue = require("./work-queue.js")();

main();

function main () {
    var events = require("./service-events.js")(docker);

    events.on("start", function (service) {
        workQueue.push(function (done) {
            registerService(service, done);
        });
    });

    events.on("stop", function (service) {
        workQueue.push(function (done) {
            unregisterService(service, done);
        });
    });

    events.on("theEnd", function () {
        console.log("Not more events from docker. Exiting...");
        process.exit(1);
    });
}

function registerService (service, done) {
    var obj = {
        name: service.properties.name,
        id:   serviceId(service),
        tags: serviceTags(service),
        address: service.ip,
        port: service.port
    };
    console.log("registering", obj.id);
    retry.retryWithThrottling(function (retry) {
        consul.agent.service.register(obj, function (err) {
            if (err) {
                retry(err);
            } else {
                console.log("registered", obj.id);
                done();
            }
        });
    }, {
        maxAttempts: 5,
        failProc: function (err) {
            console.log(err);
            done();
        }
    });
}

function serviceId (service) {
    return [
        "registrator",
        // os.hostname(),
        service.properties.name,
        service.properties.descriminator
    ].filter(_.identity).join(":");
}

function serviceTags (service) {
    var tags = (service.properties.tags || "").split(",").filter(_.identity);

    if (service.properties.descriminator) {
        tags.push(service.properties.descriminator);
    }
    return tags;
}

function unregisterService (service, done) {
    var obj = {
        id: serviceId(service)
    };
    console.log("unregistering", obj.id);
    retry.retryWithThrottling(function (retry) {
        consul.agent.service.deregister(obj, function (err) {
            if (err) {
                retry(err);
            } else {
                console.log("unregistered", obj.id);
                done();
            }
        });
    }, {
        maxAttempts: 5,
        failProc: function (err) {
            console.log(err);
            done();
        }
    });
}
