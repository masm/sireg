var events = require("events");
var jsonStream = require("../helpers/event-stream-parser.js");

module.exports = exported;

function exported (docker) {
    var eventEmitter = new events.EventEmitter();

    getEvents();

    return eventEmitter;

    function getEvents () {
        docker.getEvents(function (err, stream) {
            var objStream = jsonStream({terminatingChar: "}"});
            stream.pipe(objStream);
            processEvents(objStream);
            stream.on("end", function () {
                eventEmitter.emit("theEnd");
            });
        });
    }

    function processEvents (eventStream) {
        eventStream.on("data", function (event) {
            processEvent(event);
        });
    }

    function processEvent (event) {
        eventEmitter.emit(event.status, event);
    }
};

if (require.main === module) main();

function main () {
    var dockerode = require("dockerode");
    var docker = dockerode({socketPath: "/var/run/docker.sock"});

    var dockerEvents = exported(docker);

    dockerEvents.on("create", console.log);
    dockerEvents.on("die", console.log);
}
