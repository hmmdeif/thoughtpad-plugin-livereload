var should = require('should'),
    app = require('./../src/main'),
    co = require('co'),
    fs = require('co-fs'),
    http = require('http'),
    server,
    man = require('thoughtpad-plugin-manager'),
    thoughtpad;

describe("live reload plugin", function () {
    it("should register correctly to events", function (done) {
        thoughtpad = man.registerPlugins([app]);
        thoughtpad.config = {
            jsbundle: {
                one: [
                    'stuff'
                ],
                two: [
                    'more stuff'
                ]
            }            
        };

        thoughtpad.subscribe("javascript-precompile-complete", function *() {
            true.should.be.true;
        });

        co(function *() {
            yield thoughtpad.notify("javascript-precompile-request", {});
            done();
        }).catch(done);
    });

    it("should yield twice with each primus script", function (done) {
        var count = 0;

        thoughtpad = man.registerPlugins([app]);
        thoughtpad.config = {
            jsbundle: {
                one: [
                    'stuff'
                ],
                two: [
                    'more stuff'
                ]
            }            
        };

        thoughtpad.subscribe("javascript-precompile-complete", function *(contents) {
            count++;
            contents.ext.should.equal('js');
        });

        co(function *() {
            server = http.createServer();
            server.listen();
            yield thoughtpad.notify("initialise-complete", {server: server, thoughtpad: {config: {}}});

            yield thoughtpad.notify("javascript-precompile-request", {});
            count.should.equal(2);
            app.shutdown();
            server.close();
            done();
        }).catch(done);
    });

    it("should not put in primus script if no http server is running", function (done) {
        thoughtpad = man.registerPlugins([app]);
        thoughtpad.config = {
            jsbundle: {
                one: [
                    'stuff'
                ],
                two: [
                    'more stuff'
                ]
            }            
        };

        thoughtpad.subscribe("javascript-precompile-complete", function *(contents) {
            contents.ext.should.equal('js');
            if (contents.name === "primus") {
                contents.contents.should.equal("");
            }
        });

        co(function *() {
            yield thoughtpad.notify("javascript-precompile-request", {});
            thoughtpad.config.jsbundle.one.should.eql(['stuff']);
            app.shutdown();
            done();
        }).catch(done);
    });

    it("should put the primus script into the config", function (done) {
        thoughtpad = man.registerPlugins([app]);
        thoughtpad.config = {
            jsbundle: {
                one: [
                    'stuff'
                ],
                two: [
                    'more stuff'
                ]
            }            
        };

        thoughtpad.subscribe("javascript-precompile-complete", function *(contents) {
            contents.ext.should.equal('js');
            if (contents.name === "primus") {
                contents.contents.should.not.equal("");
            }
        });

        co(function *() {
            server = http.createServer();
            server.listen();
            yield thoughtpad.notify("initialise-complete", {server: server, thoughtpad: {config: {}}});

            yield thoughtpad.notify("javascript-precompile-request", {});
            thoughtpad.config.jsbundle.one.should.eql(['stuff', 'primus', 'primus-browser']);
            app.shutdown();
            server.close();
            done();
            
        }).catch(done);
    });


});