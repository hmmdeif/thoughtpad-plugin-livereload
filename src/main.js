var Primus = require('primus'),
    chokidar = require('chokidar'),
    co = require('co'),
    _watcher,
    canCompile = false,
    _hostnames = [],
    _primusServer;

var init = function (thoughtpad) {
    thoughtpad.subscribe("javascript-precompile-request", addScripts);
    thoughtpad.subscribe("initialise-complete", startServer);
    thoughtpad.subscribe("compile-complete", notifyClients);
},

startServer = function *(obj) {

    canCompile = false;
    if (obj.server && !_primusServer) {
        _primusServer = new Primus(obj.server, {parser: 'JSON'});

        _primusServer.on('connection', function (spark) {
            //console.log('Connected to a new client');
        });
    }

    if (obj.server && !_watcher) {
        _watcher = chokidar.watch(obj.thoughtpad.config.srcLocation + "/**", {
            ignored: '**/pre_out*',
            ignorePermissionErrors: true
        });

        _watcher.on('all', function (event, path) {
            var i = 0,
                len = _hostnames.length,
                found = false,
                hostname;

            if (canCompile) {
                for (i; i < len; i++) {
                    if (path.indexOf(_hostnames[i]) > -1) {
                        found = true;
                        hostname = _hostnames[i];
                    }
                }

                if (found) {
                    canCompile = false;          
                    co(function *() {      
                        yield obj.compile(obj.server, obj.cache, obj.mode, hostname);
                    });
                }
            }

        }).on('error', function (error) {
            console.log(error);
        }).on('ready', function () {
        });

         _hostnames.push(obj.hostname);

    } else if (obj.server && _watcher) {
        if (_hostnames.indexOf(obj.hostname) < 0) {
            _watcher.add(obj.thoughtpad.config.srcLocation + "/**");
            _hostnames.push(obj.hostname);
        }
    }
},

notifyClients = function *() {
    _primusServer.write('compileComplete');
    canCompile = true;
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

},

shutdown = function () {
    if (_primusServer) {
        _primusServer.destroy();
        _primusServer = null;
    }
},

addScripts = function *(obj) {
    var primusScript = "",
        bundleName,
        browserScriptName = 'primus-browser',
        primusScriptName = 'primus';

    // If the primus server has been correctly initialised, then we can pass the contents (helps for tests if we lay it out this way)
    if (_primusServer) {
        primusScript = _primusServer.library();    

        // Add the script files to the current thoughtpad config jsbundle object
        for (bundleName in obj.thoughtpad.config.jsbundle) {
            obj.thoughtpad.config.jsbundle[bundleName].push(primusScriptName);
            obj.thoughtpad.config.jsbundle[bundleName].push(browserScriptName);        
        }

        // If we yield twice, then two objects will be added to the scripts in total
        yield obj.thoughtpad.notify("javascript-precompile-complete", { name: browserScriptName, contents: getBrowserScript(), ext: 'js' });
        yield obj.thoughtpad.notify("javascript-precompile-complete", { name: primusScriptName, contents: primusScript, ext: 'js' });
    }
};

module.exports = {
    init: init,
    shutdown: shutdown
};