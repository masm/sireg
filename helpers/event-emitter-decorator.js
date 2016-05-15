var events = require("events");

module.exports = eventEmitterDecorator;

function eventEmitterDecorator (source, handlers) {
    const eventEmitter = new events.EventEmitter();
    setup();
    return eventEmitter;

    function setup () {
        Object.keys(handlers).forEach(eventName => {
            source.on(eventName, (data) => {
                handlers[eventName](data, (newData) => {
                    eventEmitter.emit(eventName, newData);
                });
            });
        });
    }
}
