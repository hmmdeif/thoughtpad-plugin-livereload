var Primus = require('primus'),
    primusServer,
    _thoughtpad;

var init = function (thoughtpad) {
    _thoughtpad = thoughtpad;
    _thoughtpad.subscribe("javascript-precompile-request", addScripts);
    _thoughtpad.subscribe("initialise-complete", startServer);
},

startServer = function *(server) {
    if (server && !primusServer) {
        primusServer = new Primus(server, {parser: 'JSON'});

        primusServer.on('connection', function (spark) {
            console.log('Connected to a new client');
        });
    }
},

getBrowserScript = function () {
    return ' \
        (function() { \
            var primus = Primus.connect(); \
            primus.on("data", function (data) { \
                if (data === "compileComplete") { \
                    document.location.reload(); \
                } \
            }); \
            primus.on("open", function () { \
                console.log("Connected to development server"); \
            }); \
            primus.on("error", function (err) { \
                console.log("Error: ", err, err.message); \
            }); \
            primus.on("reconnect", function () { \
                console.log("Reconnect attempt started"); \
            }); \
            primus.on("reconnecting", function (opts) { \
                console.log("Reconnecting in %d ms", opts.timeout); \
                console.log("This is attempt %d out of %d", opts.attempt, opts.retries); \
            }); \
            primus.on("end", function () { \
                console.log("Connection closed"); \
            }); \
        })(); \
    ';

}

addScripts = function *(obj) {
    var primusScript = "",
        bundleName,
        browserScriptName = 'primus-browser',
        primusScriptName = 'primus';

    // If the primus server has been correctly initialised, then we can pass the contents (helps for tests if we lay it out this way)
    if (primusServer) {
        primusScript = primusServer.library();
    }

    // Add the script files to the current thoughtpad config jsbundle object
    for (bundleName in _thoughtpad.config.jsbundle) {
        _thoughtpad.config.jsbundle[bundleName].push(browserScriptName);
        _thoughtpad.config.jsbundle[bundleName].push(primusScriptName);
    }

    // If we yield twice, then two objects will be added to the scripts in total
    yield _thoughtpad.notify("javascript-precompile-complete", { name: browserScriptName, contents: getBrowserScript(), ext: 'js' });
    yield _thoughtpad.notify("javascript-precompile-complete", { name: primusScriptName, contents: primusScript, ext: 'js' });
};

module.exports = {
    init: init
};