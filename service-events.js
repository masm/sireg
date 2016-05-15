var _ = require("lodash");
var dockerServiceEvents = require("./docker-service-events.js");
var eventEmitterDecorator = require("./helpers/event-emitter-decorator.js");
var consulDockerDataTranslation = require("./consul-docker-data-translation.js")();

module.exports = exported;

function exported (docker, consulService) {
    const serviceEvents = dockerServiceEvents(docker);

    const knownServices = {};

    return eventEmitter();

    function eventEmitter () {
        var eventEmitter = eventEmitterDecorator(serviceEvents, {
            start: (service, next) => {
                var data = consulDockerDataTranslation.serviceRegistryObject(service);
                noteStarted(data.id);
                next(data);
            },
            stop: (service, next) => {
                var data = {id: consulDockerDataTranslation.serviceId(service)};
                noteStopped(data.id);
                next(data);
            },
            theEnd: (data, next) => next(data),
        });

        setTimeout(() => {
            setInterval(() => sync(eventEmitter), 300000);
            sync(eventEmitter);
        }, 5000);

        return eventEmitter;
    }

    function sync (eventEmitter) {
        registeredNames((ids) => {
            ids.forEach((id) => {
                if (!knownServices[id]) {
                    eventEmitter.emit("stop", {id});
                }
            });
        });

        function registeredNames (done) {
            consulService.registered((err, result) => {
                if (err) {
                    done([]);
                } else {
                    done(Object.keys(result).filter(function (key) { return /^registrator:/.test(key); }));
                }
            });
        }
    }

    function noteStarted (id) {
        knownServices[id] = true;
    }

    function noteStopped (id) {
        delete knownServices[id];
    }
}
