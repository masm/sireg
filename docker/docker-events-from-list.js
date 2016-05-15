var events = require("events");

module.exports = exported;

function exported (docker, interval) {
    var eventEmitter = new events.EventEmitter();

    list();

    if (interval) {
        setInterval(list, interval * 1000);
    }

    return eventEmitter;

    function list () {
        docker.listContainers(function (err, containers) {
            containers.forEach(function (containerInfo) {
                emitEventForContainer(containerInfo);
            });
        });
    }

    function emitEventForContainer (containerInfo) {
        eventEmitter.emit("running", {
            status: "running",
            id: containerInfo.Id,
            from: containerInfo.Image,
            time: containerInfo.Created
        });
    }
};

if (require.main === module) main();

function main () {
    var dockerode = require("dockerode");
    var docker = dockerode({socketPath: "/var/run/docker.sock"});

    var dockerEvents = exported(docker, 5);

    dockerEvents.on("running", console.log);
}
