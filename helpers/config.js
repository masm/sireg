module.exports = function (name) {
    var env = process.env;
    if (name in env) {
        return env[name];
    } else {
        throw new Error(name + " not defined");
    }
};
